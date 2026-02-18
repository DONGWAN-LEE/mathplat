/**
 * 풀이 시도 리포지토리
 *
 * Prisma 기반의 풀이 시도(UserProblemAttempt) 데이터 접근 계층입니다.
 *
 * @module attempt
 */

import { Injectable } from '@nestjs/common';
import { UserProblemAttempt } from '@prisma/client';
import { PrismaService } from '../core/database/prisma.service';

@Injectable()
export class AttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 풀이 시도를 생성합니다
   *
   * @param data - 시도 생성 데이터
   * @returns 생성된 시도 엔티티
   */
  async create(data: {
    userId: string;
    problemId: string;
    isCorrect: boolean;
    submittedAnswer: any;
    timeTaken: number;
    attemptNumber: number;
  }): Promise<UserProblemAttempt> {
    return this.prisma.userProblemAttempt.create({ data });
  }

  /**
   * 사용자+문제 조합의 시도 수를 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param problemId - 문제 고유 식별자
   * @returns 기존 시도 수
   */
  async countByUserAndProblem(
    userId: string,
    problemId: string,
  ): Promise<number> {
    return this.prisma.userProblemAttempt.count({
      where: { userId, problemId, deletedAt: null },
    });
  }

  /**
   * 사용자의 풀이 이력을 조회합니다 (페이지네이션)
   *
   * @param userId - 사용자 고유 식별자
   * @param page - 페이지 번호 (1-based)
   * @param limit - 페이지 당 항목 수
   * @returns 시도 목록과 전체 개수
   */
  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: UserProblemAttempt[]; total: number }> {
    const where = { userId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.userProblemAttempt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          problem: {
            select: { id: true, content: true, type: true, difficulty: true },
          },
        },
      }),
      this.prisma.userProblemAttempt.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * 특정 문제에 대한 사용자의 풀이 이력을 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param problemId - 문제 고유 식별자
   * @returns 시도 목록
   */
  async findByUserAndProblem(
    userId: string,
    problemId: string,
  ): Promise<UserProblemAttempt[]> {
    return this.prisma.userProblemAttempt.findMany({
      where: { userId, problemId, deletedAt: null },
      orderBy: { attemptNumber: 'asc' },
    });
  }

  /**
   * 문제의 총 풀이 수와 정답 수를 조회합니다
   *
   * @param problemId - 문제 고유 식별자
   * @returns 총 풀이 수와 정답 수
   */
  async getProblemStats(
    problemId: string,
  ): Promise<{ total: number; correct: number }> {
    const [total, correct] = await Promise.all([
      this.prisma.userProblemAttempt.count({
        where: { problemId, deletedAt: null },
      }),
      this.prisma.userProblemAttempt.count({
        where: { problemId, isCorrect: true, deletedAt: null },
      }),
    ]);

    return { total, correct };
  }
}
