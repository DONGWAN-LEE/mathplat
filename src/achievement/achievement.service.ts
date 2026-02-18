/**
 * 업적 및 통계 서비스
 *
 * 업적(Achievement) 관리, 사용자 통계(UserStats) 갱신,
 * 레벨/XP 계산, 스트릭 관리, 업적 조건 평가를 처리합니다.
 *
 * @module achievement
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Achievement, UserAchievement, UserStats } from '@prisma/client';
import { AchievementRepository } from './achievement.repository';
import { CacheService } from '../core/cache/cache.service';
import { LoggerService } from '../core/logger/logger.service';
import { CACHE_KEYS, CACHE_TTL } from '../core/cache/cache-key.constants';
import { CreateAchievementDto } from './dto/create-achievement.dto';

@Injectable()
export class AchievementService {
  private readonly logger: LoggerService;

  constructor(
    private readonly achievementRepository: AchievementRepository,
    private readonly cacheService: CacheService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('AchievementService');
  }

  // ──────────────────────────────────────────
  // Achievement CRUD
  // ──────────────────────────────────────────

  /**
   * 업적 정의를 생성합니다
   *
   * @param dto - 업적 생성 데이터
   * @returns 생성된 업적 엔티티
   */
  async createAchievement(dto: CreateAchievementDto): Promise<Achievement> {
    const achievement = await this.achievementRepository.createAchievement(dto);
    this.logger.info('Achievement created', { achievementId: achievement.id });
    return achievement;
  }

  /**
   * 전체 업적 목록을 조회합니다
   *
   * @returns 업적 목록
   */
  async findAllAchievements(): Promise<Achievement[]> {
    return this.achievementRepository.findAllAchievements();
  }

  /**
   * 사용자가 달성한 업적 목록을 조회합니다
   *
   * 캐시 우선 조회를 적용합니다.
   *
   * @param userId - 사용자 고유 식별자
   * @returns 달성 업적 목록
   */
  async findUserAchievements(userId: string): Promise<UserAchievement[]> {
    const cacheKey = CACHE_KEYS.USER_ACHIEVEMENTS(userId);
    const cached = await this.cacheService.get<UserAchievement[]>(cacheKey);

    if (cached) {
      this.logger.debug('User achievements found in cache', { userId });
      return cached;
    }

    const achievements = await this.achievementRepository.findUserAchievements(userId);
    await this.cacheService.set(cacheKey, achievements, CACHE_TTL.USER_ACHIEVEMENTS);
    return achievements;
  }

  // ──────────────────────────────────────────
  // Stats
  // ──────────────────────────────────────────

  /**
   * 사용자 통계를 조회합니다
   *
   * 캐시 우선 조회를 적용합니다.
   * 통계가 없으면 기본값으로 생성합니다.
   *
   * @param userId - 사용자 고유 식별자
   * @returns 사용자 통계 엔티티
   */
  async findStatsByUserId(userId: string): Promise<UserStats> {
    const cacheKey = CACHE_KEYS.USER_STATS(userId);
    const cached = await this.cacheService.get<UserStats>(cacheKey);

    if (cached) {
      this.logger.debug('User stats found in cache', { userId });
      return cached;
    }

    let stats = await this.achievementRepository.findStatsByUserId(userId);

    if (!stats) {
      stats = await this.achievementRepository.upsertStats(userId, {
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalProblemsSolved: 0,
        totalStudyTime: 0,
      });
    }

    await this.cacheService.set(cacheKey, stats, CACHE_TTL.USER_STATS);
    return stats;
  }

  /**
   * Attempt 제출 후 통계를 업데이트합니다
   *
   * 업데이트 항목:
   * - totalProblemsSolved++
   * - totalStudyTime += timeTaken
   * - XP: 정답 +10, 오답 +2
   * - level = floor(totalXp / 100) + 1
   * - 스트릭: 오늘 첫 풀이 시 currentStreak++
   *
   * @param userId - 사용자 고유 식별자
   * @param isCorrect - 정답 여부 (null이면 미채점)
   * @param timeTaken - 풀이 시간 (초)
   */
  async updateStatsAfterAttempt(
    userId: string,
    isCorrect: boolean | null,
    timeTaken: number,
  ): Promise<void> {
    const stats = await this.findStatsByUserId(userId);

    let xpGain = 0;
    if (isCorrect === true) {
      xpGain = 10;
    } else if (isCorrect === false) {
      xpGain = 2;
    }

    const newTotalXp = stats.totalXp + xpGain;
    const newLevel = Math.floor(newTotalXp / 100) + 1;
    const newTotalProblemsSolved = stats.totalProblemsSolved + 1;
    const newTotalStudyTime = stats.totalStudyTime + timeTaken;

    let newCurrentStreak = stats.currentStreak;
    let newLongestStreak = stats.longestStreak;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastUpdate = new Date(stats.updatedAt);
    lastUpdate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (stats.totalProblemsSolved === 0) {
      newCurrentStreak = 1;
    } else if (dayDiff === 1) {
      newCurrentStreak = stats.currentStreak + 1;
    } else if (dayDiff > 1) {
      newCurrentStreak = 1;
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    await this.achievementRepository.upsertStats(userId, {
      totalXp: newTotalXp,
      level: newLevel,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalProblemsSolved: newTotalProblemsSolved,
      totalStudyTime: newTotalStudyTime,
    });

    await this.cacheService.del(CACHE_KEYS.USER_STATS(userId));
    this.logger.info('Stats updated after attempt', {
      userId,
      xpGain,
      newLevel,
      streak: newCurrentStreak,
    });
  }

  /**
   * Attempt 제출 후 업적 조건을 확인합니다
   *
   * 미달성 업적의 조건을 평가하고, 조건 충족 시 업적을 부여합니다.
   *
   * @param userId - 사용자 고유 식별자
   */
  async checkAchievements(userId: string): Promise<void> {
    const [allAchievements, userAchievements, stats] = await Promise.all([
      this.achievementRepository.findAllAchievements(),
      this.achievementRepository.findUserAchievements(userId),
      this.findStatsByUserId(userId),
    ]);

    const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;

      const condition = achievement.condition as Record<string, any>;
      let met = true;

      if (condition.totalProblemsSolved !== undefined) {
        if (stats.totalProblemsSolved < condition.totalProblemsSolved) met = false;
      }
      if (condition.currentStreak !== undefined) {
        if (stats.currentStreak < condition.currentStreak) met = false;
      }
      if (condition.level !== undefined) {
        if (stats.level < condition.level) met = false;
      }
      if (condition.totalXp !== undefined) {
        if (stats.totalXp < condition.totalXp) met = false;
      }

      if (met) {
        await this.achievementRepository.createUserAchievement(userId, achievement.id);

        if (achievement.xpReward > 0) {
          const updatedStats = await this.achievementRepository.findStatsByUserId(userId);
          if (updatedStats) {
            const newXp = updatedStats.totalXp + achievement.xpReward;
            await this.achievementRepository.upsertStats(userId, {
              ...updatedStats,
              totalXp: newXp,
              level: Math.floor(newXp / 100) + 1,
            });
          }
        }

        await this.cacheService.del(CACHE_KEYS.USER_ACHIEVEMENTS(userId));
        await this.cacheService.del(CACHE_KEYS.USER_STATS(userId));
        this.logger.info('Achievement earned', {
          userId,
          achievementId: achievement.id,
          name: achievement.name,
        });
      }
    }
  }
}
