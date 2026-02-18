/**
 * 문제 서비스
 *
 * 문제(Problem) 도메인의 비즈니스 로직을 처리합니다.
 * 캐시 우선 조회, 필터링, 페이지네이션, 목록에서 정답/풀이 제외 로직을 포함합니다.
 *
 * @module problem
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Problem } from '@prisma/client';
import { ProblemRepository } from './problem.repository';
import { CacheService } from '../core/cache/cache.service';
import { LoggerService } from '../core/logger/logger.service';
import { CACHE_KEYS, CACHE_TTL } from '../core/cache/cache-key.constants';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemFilterDto } from './dto/problem-filter.dto';

@Injectable()
export class ProblemService {
  private readonly logger: LoggerService;

  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly cacheService: CacheService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('ProblemService');
  }

  /**
   * 문제를 생성합니다
   *
   * @param dto - 문제 생성 데이터
   * @returns 생성된 문제 엔티티
   */
  async create(dto: CreateProblemDto): Promise<Problem> {
    const problem = await this.problemRepository.create(dto);
    await this.invalidateProblemListCache(dto.topicId);
    this.logger.info('Problem created', { problemId: problem.id, topicId: dto.topicId });
    return problem;
  }

  /**
   * 문제 상세를 조회합니다 (answer, solution 포함)
   *
   * 캐시 우선 조회를 적용합니다.
   *
   * @param id - 문제 고유 식별자
   * @returns 문제 엔티티
   * @throws NotFoundException 문제가 존재하지 않는 경우
   */
  async findById(id: string): Promise<Problem> {
    const cacheKey = CACHE_KEYS.PROBLEM(id);
    const cached = await this.cacheService.get<Problem>(cacheKey);

    if (cached) {
      this.logger.debug('Problem found in cache', { problemId: id });
      return cached;
    }

    const problem = await this.problemRepository.findById(id);

    if (!problem) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Problem not found' },
      });
    }

    await this.cacheService.set(cacheKey, problem, CACHE_TTL.PROBLEM);
    return problem;
  }

  /**
   * 문제 목록을 조회합니다 (answer, solution 제외)
   *
   * 필터링(topicId, objectiveId, difficulty, type)과 페이지네이션을 지원합니다.
   * 목록 응답에서는 정답 노출 방지를 위해 answer, solution 필드를 제외합니다.
   *
   * @param filter - 필터 및 페이지네이션 조건
   * @returns 문제 목록 (answer/solution 제외)과 메타 정보
   */
  async findMany(filter: ProblemFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const { items, total } = await this.problemRepository.findMany(
      {
        topicId: filter.topicId,
        objectiveId: filter.objectiveId,
        difficultyMin: filter.difficultyMin,
        difficultyMax: filter.difficultyMax,
        type: filter.type,
      },
      page,
      limit,
    );

    const sanitizedItems = items.map((item) => {
      const { answer, solution, ...rest } = item;
      return rest;
    });

    return {
      items: sanitizedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 문제를 수정합니다
   *
   * @param id - 문제 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 문제 엔티티
   * @throws NotFoundException 문제가 존재하지 않는 경우
   */
  async update(id: string, dto: UpdateProblemDto): Promise<Problem> {
    const existing = await this.problemRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Problem not found' },
      });
    }

    const updated = await this.problemRepository.update(id, dto as any);
    await this.cacheService.del(CACHE_KEYS.PROBLEM(id));
    await this.invalidateProblemListCache(existing.topicId);

    if (dto.topicId && dto.topicId !== existing.topicId) {
      await this.invalidateProblemListCache(dto.topicId);
    }

    this.logger.info('Problem updated', { problemId: id });
    return updated;
  }

  /**
   * 문제를 소프트 삭제합니다
   *
   * @param id - 문제 고유 식별자
   * @returns 삭제된 문제 엔티티
   * @throws NotFoundException 문제가 존재하지 않는 경우
   */
  async delete(id: string): Promise<Problem> {
    const existing = await this.problemRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Problem not found' },
      });
    }

    const deleted = await this.problemRepository.softDelete(id);
    await this.cacheService.del(CACHE_KEYS.PROBLEM(id));
    await this.invalidateProblemListCache(existing.topicId);

    this.logger.info('Problem deleted', { problemId: id });
    return deleted;
  }

  /**
   * 문제 풀이 통계를 업데이트합니다
   *
   * Attempt 채점 후 호출되어 solveCount, correctRate를 갱신합니다.
   *
   * @param problemId - 문제 고유 식별자
   * @param solveCount - 총 풀이 수
   * @param correctRate - 정답률
   */
  async updateStats(
    problemId: string,
    solveCount: number,
    correctRate: number,
  ): Promise<void> {
    await this.problemRepository.updateStats(problemId, solveCount, correctRate);
    await this.cacheService.del(CACHE_KEYS.PROBLEM(problemId));
  }

  /**
   * 토픽별 문제 목록 캐시를 무효화합니다
   *
   * @param topicId - 소단원 고유 식별자
   */
  private async invalidateProblemListCache(topicId: string): Promise<void> {
    await this.cacheService.del(CACHE_KEYS.PROBLEM_LIST(topicId));
  }
}
