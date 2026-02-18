/**
 * 학습 진도 리포지토리
 *
 * Prisma 기반의 학습 진도(UserProgress) 데이터 접근 계층입니다.
 *
 * @module progress
 */

import { Injectable } from '@nestjs/common';
import { UserProgress } from '@prisma/client';
import { PrismaService } from '../core/database/prisma.service';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자의 특정 토픽 진도를 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param topicId - 토픽 고유 식별자
   * @returns 진도 엔티티 또는 null
   */
  async findByUserAndTopic(
    userId: string,
    topicId: string,
  ): Promise<UserProgress | null> {
    return this.prisma.userProgress.findFirst({
      where: { userId, topicId, deletedAt: null },
      include: {
        topic: {
          select: { id: true, name: true, sectionId: true },
        },
      },
    });
  }

  /**
   * 사용자의 전체 학습 진도를 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 진도 목록 (토픽 정보 포함)
   */
  async findAllByUser(userId: string): Promise<UserProgress[]> {
    return this.prisma.userProgress.findMany({
      where: { userId, deletedAt: null },
      include: {
        topic: {
          select: { id: true, name: true, sectionId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * 학습 진도를 upsert합니다 (생성 또는 업데이트)
   *
   * Attempt 제출 시 자동으로 호출됩니다.
   *
   * @param userId - 사용자 고유 식별자
   * @param topicId - 토픽 고유 식별자
   * @param problemsSolved - 풀이한 문제 수
   * @param correctCount - 정답 수
   * @param masteryLevel - 숙련도
   * @returns 생성 또는 업데이트된 진도 엔티티
   */
  async upsert(
    userId: string,
    topicId: string,
    problemsSolved: number,
    correctCount: number,
    masteryLevel: number,
  ): Promise<UserProgress> {
    return this.prisma.userProgress.upsert({
      where: {
        userId_topicId: { userId, topicId },
      },
      update: {
        problemsSolved,
        correctCount,
        masteryLevel,
        updatedAt: new Date(),
      },
      create: {
        userId,
        topicId,
        problemsSolved,
        correctCount,
        masteryLevel,
      },
    });
  }
}
