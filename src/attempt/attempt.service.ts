/**
 * 풀이 시도 서비스
 *
 * 답안 제출, 자동 채점, 시도 번호 관리, 통계 갱신을 처리합니다.
 * 채점 후 Problem 통계, Progress, Stats를 자동 업데이트합니다.
 *
 * @module attempt
 */

import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { UserProblemAttempt, ProblemType } from '@prisma/client';
import { AttemptRepository } from './attempt.repository';
import { ProblemService } from '../problem/problem.service';
import { ProgressService } from '../progress/progress.service';
import { AchievementService } from '../achievement/achievement.service';
import { LoggerService } from '../core/logger/logger.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class AttemptService {
  private readonly logger: LoggerService;

  constructor(
    private readonly attemptRepository: AttemptRepository,
    private readonly problemService: ProblemService,
    @Inject(forwardRef(() => ProgressService))
    private readonly progressService: ProgressService,
    @Inject(forwardRef(() => AchievementService))
    private readonly achievementService: AchievementService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('AttemptService');
  }

  /**
   * 답안을 제출하고 자동 채점합니다
   *
   * 채점 로직:
   * - MULTIPLE_CHOICE, TRUE_FALSE: 정확히 일치
   * - SHORT_ANSWER, FILL_IN_BLANK: 문자열 트림 후 비교
   * - ESSAY: isCorrect = null (수동 채점 필요)
   *
   * 채점 후 자동 수행:
   * 1. attemptNumber 자동 증가
   * 2. Problem의 solveCount, correctRate 업데이트
   * 3. Progress 자동 업데이트
   * 4. Stats 업데이트
   * 5. Achievement 조건 체크
   *
   * @param userId - 사용자 고유 식별자
   * @param dto - 답안 제출 데이터
   * @returns 생성된 시도 엔티티
   * @throws NotFoundException 문제가 존재하지 않는 경우
   */
  async submit(userId: string, dto: SubmitAttemptDto): Promise<UserProblemAttempt> {
    const problem = await this.problemService.findById(dto.problemId);

    const isCorrect = this.grade(
      problem.type,
      problem.answer,
      dto.submittedAnswer,
    );

    const attemptCount = await this.attemptRepository.countByUserAndProblem(
      userId,
      dto.problemId,
    );

    const attempt = await this.attemptRepository.create({
      userId,
      problemId: dto.problemId,
      isCorrect: isCorrect === true,
      submittedAnswer: dto.submittedAnswer,
      timeTaken: dto.timeTaken ?? 0,
      attemptNumber: attemptCount + 1,
    });

    this.logger.info('Attempt submitted', {
      attemptId: attempt.id,
      userId,
      problemId: dto.problemId,
      isCorrect,
      attemptNumber: attempt.attemptNumber,
    });

    await this.updateProblemStats(dto.problemId);

    if (isCorrect !== null) {
      await this.progressService.updateProgress(userId, problem.topicId, isCorrect);
    }

    await this.achievementService.updateStatsAfterAttempt(
      userId,
      isCorrect,
      dto.timeTaken ?? 0,
    );

    await this.achievementService.checkAchievements(userId);

    return attempt;
  }

  /**
   * 사용자의 풀이 이력을 조회합니다 (페이지네이션)
   *
   * @param userId - 사용자 고유 식별자
   * @param page - 페이지 번호 (기본 1)
   * @param limit - 페이지 당 항목 수 (기본 20)
   * @returns 시도 목록과 메타 정보
   */
  async findMyAttempts(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const { items, total } = await this.attemptRepository.findByUser(
      userId,
      page,
      limit,
    );

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 특정 문제에 대한 사용자의 풀이 이력을 조회합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param problemId - 문제 고유 식별자
   * @returns 시도 목록
   */
  async findMyProblemAttempts(
    userId: string,
    problemId: string,
  ): Promise<UserProblemAttempt[]> {
    return this.attemptRepository.findByUserAndProblem(userId, problemId);
  }

  /**
   * 자동 채점을 수행합니다
   *
   * @param type - 문제 유형
   * @param answer - 정답
   * @param submittedAnswer - 제출 답안
   * @returns 정답 여부 (null: 수동 채점 필요)
   */
  private grade(
    type: ProblemType,
    answer: any,
    submittedAnswer: any,
  ): boolean | null {
    switch (type) {
      case ProblemType.MULTIPLE_CHOICE:
      case ProblemType.TRUE_FALSE:
        return JSON.stringify(answer) === JSON.stringify(submittedAnswer);

      case ProblemType.SHORT_ANSWER:
      case ProblemType.FILL_IN_BLANK: {
        const answerStr = String(answer).trim().toLowerCase();
        const submittedStr = String(submittedAnswer).trim().toLowerCase();
        return answerStr === submittedStr;
      }

      case ProblemType.ESSAY:
        return null;

      default:
        return JSON.stringify(answer) === JSON.stringify(submittedAnswer);
    }
  }

  /**
   * 문제의 풀이 통계를 업데이트합니다
   *
   * @param problemId - 문제 고유 식별자
   */
  private async updateProblemStats(problemId: string): Promise<void> {
    const { total, correct } = await this.attemptRepository.getProblemStats(problemId);
    const correctRate = total > 0 ? correct / total : 0;
    await this.problemService.updateStats(problemId, total, correctRate);
  }
}
