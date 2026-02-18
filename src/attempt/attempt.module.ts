/**
 * 풀이 시도 모듈
 *
 * 답안 제출, 자동 채점, 풀이 이력 관리에 필요한
 * 컨트롤러, 서비스, 리포지토리를 등록합니다.
 *
 * 의존성:
 * - ProblemModule: 문제 조회 및 통계 업데이트
 * - ProgressModule: 학습 진도 업데이트 (forwardRef)
 * - AchievementModule: 통계 및 업적 업데이트 (forwardRef)
 *
 * @module attempt
 */

import { Module, forwardRef } from '@nestjs/common';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';
import { AttemptRepository } from './attempt.repository';
import { ProblemModule } from '../problem/problem.module';
import { ProgressModule } from '../progress/progress.module';
import { AchievementModule } from '../achievement/achievement.module';
import { LoggerService } from '../core/logger/logger.service';

/**
 * 풀이 시도 도메인 모듈
 *
 * @description
 * - AttemptController: REST API 엔드포인트 (답안 제출, 이력 조회)
 * - AttemptService: 비즈니스 로직 (자동 채점, 통계 갱신)
 * - AttemptRepository: Prisma 기반 데이터 접근 계층
 */
@Module({
  imports: [
    ProblemModule,
    forwardRef(() => ProgressModule),
    forwardRef(() => AchievementModule),
  ],
  controllers: [AttemptController],
  providers: [AttemptService, AttemptRepository, LoggerService],
  exports: [AttemptService],
})
export class AttemptModule {}
