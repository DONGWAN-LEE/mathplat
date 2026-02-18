/**
 * 문제 리포지토리
 *
 * Prisma 기반의 문제(Problem) 데이터 접근 계층입니다.
 *
 * @module problem
 */

import { Injectable } from '@nestjs/common';
import { Problem, ProblemType } from '@prisma/client';
import { PrismaService } from '../core/database/prisma.service';

/**
 * 문제 필터 인터페이스
 */
interface ProblemFilter {
  topicId?: string;
  objectiveId?: string;
  difficultyMin?: number;
  difficultyMax?: number;
  type?: ProblemType;
}

@Injectable()
export class ProblemRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 문제를 생성합니다
   *
   * @param data - 문제 생성 데이터
   * @returns 생성된 문제 엔티티
   */
  async create(data: {
    topicId: string;
    objectiveId?: string;
    content: string;
    type?: ProblemType;
    difficulty?: number;
    answer: any;
    solution: any;
    hints?: any;
    conceptTags?: any;
    estimatedTime?: number;
  }): Promise<Problem> {
    return this.prisma.problem.create({ data });
  }

  /**
   * ID로 문제를 조회합니다
   *
   * @param id - 문제 고유 식별자
   * @returns 문제 엔티티 또는 null
   */
  async findById(id: string): Promise<Problem | null> {
    return this.prisma.problem.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * 문제 목록을 조회합니다 (필터링 + 페이지네이션)
   *
   * @param filter - 필터 조건
   * @param page - 페이지 번호 (1-based)
   * @param limit - 페이지 당 항목 수
   * @returns 문제 목록과 전체 개수
   */
  async findMany(
    filter: ProblemFilter,
    page: number,
    limit: number,
  ): Promise<{ items: Problem[]; total: number }> {
    const where: any = { deletedAt: null };

    if (filter.topicId) where.topicId = filter.topicId;
    if (filter.objectiveId) where.objectiveId = filter.objectiveId;
    if (filter.type) where.type = filter.type;

    if (filter.difficultyMin !== undefined || filter.difficultyMax !== undefined) {
      where.difficulty = {};
      if (filter.difficultyMin !== undefined) where.difficulty.gte = filter.difficultyMin;
      if (filter.difficultyMax !== undefined) where.difficulty.lte = filter.difficultyMax;
    }

    const [items, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.problem.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * 문제를 수정합니다
   *
   * @param id - 문제 고유 식별자
   * @param data - 수정할 필드
   * @returns 수정된 문제 엔티티
   */
  async update(
    id: string,
    data: Partial<{
      topicId: string;
      objectiveId: string;
      content: string;
      type: ProblemType;
      difficulty: number;
      answer: any;
      solution: any;
      hints: any;
      conceptTags: any;
      estimatedTime: number;
    }>,
  ): Promise<Problem> {
    return this.prisma.problem.update({
      where: { id },
      data: { ...data, updatedAt: new Date() } as any,
    });
  }

  /**
   * 문제를 소프트 삭제합니다
   *
   * @param id - 문제 고유 식별자
   * @returns 삭제된 문제 엔티티
   */
  async softDelete(id: string): Promise<Problem> {
    return this.prisma.problem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 문제의 풀이 통계를 업데이트합니다
   *
   * @param id - 문제 고유 식별자
   * @param solveCount - 총 풀이 수
   * @param correctRate - 정답률
   * @returns 업데이트된 문제 엔티티
   */
  async updateStats(
    id: string,
    solveCount: number,
    correctRate: number,
  ): Promise<Problem> {
    return this.prisma.problem.update({
      where: { id },
      data: { solveCount, correctRate, updatedAt: new Date() },
    });
  }
}
