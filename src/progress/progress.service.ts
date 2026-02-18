/**
 * 학습 진도 서비스
 *
 * 학습 진도(UserProgress) 도메인의 비즈니스 로직을 처리합니다.
 * Attempt 제출 시 자동 upsert로 진도를 갱신합니다.
 *
 * @module progress
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProgress } from '@prisma/client';
import { ProgressRepository } from './progress.repository';
import { CacheService } from '../core/cache/cache.service';
import { LoggerService } from '../core/logger/logger.service';
import { CACHE_KEYS, CACHE_TTL } from '../core/cache/cache-key.constants';

@Injectable()
export class ProgressService {
  private readonly logger: LoggerService;

  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly cacheService: CacheService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('ProgressService');
  }

  /**
   * 사용자의 전체 학습 진도를 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 학습 진도 목록 (토픽 정보 포함)
   */
  async findAllByUser(userId: string): Promise<UserProgress[]> {
    return this.progressRepository.findAllByUser(userId);
  }

  /**
   * 사용자의 특정 토픽 학습 진도를 조회합니다
   *
   * 캐시 우선 조회를 적용합니다.
   *
   * @param userId - 사용자 고유 식별자
   * @param topicId - 토픽 고유 식별자
   * @returns 학습 진도 엔티티
   * @throws NotFoundException 진도 데이터가 존재하지 않는 경우
   */
  async findByUserAndTopic(
    userId: string,
    topicId: string,
  ): Promise<UserProgress> {
    const cacheKey = CACHE_KEYS.USER_PROGRESS(userId, topicId);
    const cached = await this.cacheService.get<UserProgress>(cacheKey);

    if (cached) {
      this.logger.debug('Progress found in cache', { userId, topicId });
      return cached;
    }

    const progress = await this.progressRepository.findByUserAndTopic(userId, topicId);

    if (!progress) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Progress not found for this topic' },
      });
    }

    await this.cacheService.set(cacheKey, progress, CACHE_TTL.USER_PROGRESS);
    return progress;
  }

  /**
   * 학습 진도를 업데이트합니다
   *
   * Attempt 채점 후 호출됩니다.
   * problemsSolved++, 정답이면 correctCount++,
   * masteryLevel = correctCount / problemsSolved
   *
   * @param userId - 사용자 고유 식별자
   * @param topicId - 토픽 고유 식별자
   * @param isCorrect - 정답 여부
   */
  async updateProgress(
    userId: string,
    topicId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const existing = await this.progressRepository.findByUserAndTopic(userId, topicId);

    let problemsSolved = 1;
    let correctCount = isCorrect ? 1 : 0;

    if (existing) {
      problemsSolved = existing.problemsSolved + 1;
      correctCount = existing.correctCount + (isCorrect ? 1 : 0);
    }

    const masteryLevel = correctCount / problemsSolved;

    await this.progressRepository.upsert(
      userId,
      topicId,
      problemsSolved,
      correctCount,
      masteryLevel,
    );

    await this.cacheService.del(CACHE_KEYS.USER_PROGRESS(userId, topicId));
    this.logger.info('Progress updated', { userId, topicId, masteryLevel });
  }
}
