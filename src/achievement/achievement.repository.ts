/**
 * 업적 리포지토리
 *
 * Prisma 기반의 업적(Achievement), 사용자 업적(UserAchievement),
 * 사용자 통계(UserStats) 데이터 접근 계층입니다.
 *
 * @module achievement
 */

import { Injectable } from '@nestjs/common';
import { Achievement, UserAchievement, UserStats } from '@prisma/client';
import { PrismaService } from '../core/database/prisma.service';

@Injectable()
export class AchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // Achievement
  // ──────────────────────────────────────────

  /**
   * 업적을 생성합니다
   *
   * @param data - 업적 생성 데이터
   * @returns 생성된 업적 엔티티
   */
  async createAchievement(data: {
    name: string;
    description: string;
    iconUrl?: string;
    condition: any;
    xpReward?: number;
  }): Promise<Achievement> {
    return this.prisma.achievement.create({ data });
  }

  /**
   * 전체 업적 목록을 조회합니다
   *
   * @returns 업적 목록
   */
  async findAllAchievements(): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * ID로 업적을 조회합니다
   *
   * @param id - 업적 고유 식별자
   * @returns 업적 엔티티 또는 null
   */
  async findAchievementById(id: string): Promise<Achievement | null> {
    return this.prisma.achievement.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // ──────────────────────────────────────────
  // UserAchievement
  // ──────────────────────────────────────────

  /**
   * 사용자가 달성한 업적 목록을 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 달성 업적 목록 (업적 정보 포함)
   */
  async findUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.prisma.userAchievement.findMany({
      where: { userId, deletedAt: null },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /**
   * 사용자가 특정 업적을 달성했는지 확인합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param achievementId - 업적 고유 식별자
   * @returns 달성 여부
   */
  async hasUserAchievement(
    userId: string,
    achievementId: string,
  ): Promise<boolean> {
    const found = await this.prisma.userAchievement.findFirst({
      where: { userId, achievementId, deletedAt: null },
    });
    return !!found;
  }

  /**
   * 사용자 업적을 생성합니다 (달성 기록)
   *
   * @param userId - 사용자 고유 식별자
   * @param achievementId - 업적 고유 식별자
   * @returns 생성된 사용자 업적 엔티티
   */
  async createUserAchievement(
    userId: string,
    achievementId: string,
  ): Promise<UserAchievement> {
    return this.prisma.userAchievement.create({
      data: { userId, achievementId },
    });
  }

  // ──────────────────────────────────────────
  // UserStats
  // ──────────────────────────────────────────

  /**
   * 사용자 통계를 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 사용자 통계 엔티티 또는 null
   */
  async findStatsByUserId(userId: string): Promise<UserStats | null> {
    return this.prisma.userStats.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  /**
   * 사용자 통계를 upsert합니다 (생성 또는 업데이트)
   *
   * @param userId - 사용자 고유 식별자
   * @param data - 통계 데이터
   * @returns 생성 또는 업데이트된 통계 엔티티
   */
  async upsertStats(
    userId: string,
    data: {
      totalXp: number;
      level: number;
      currentStreak: number;
      longestStreak: number;
      totalProblemsSolved: number;
      totalStudyTime: number;
    },
  ): Promise<UserStats> {
    return this.prisma.userStats.upsert({
      where: { userId },
      update: { ...data, updatedAt: new Date() },
      create: { userId, ...data },
    });
  }
}
