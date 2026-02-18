/**
 * 문제 모듈
 *
 * 문제(Problem) 도메인에 필요한 컨트롤러, 서비스, 리포지토리를 등록합니다.
 *
 * @module problem
 */

import { Module } from '@nestjs/common';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { ProblemRepository } from './problem.repository';
import { LoggerService } from '../core/logger/logger.service';

/**
 * 문제 도메인 모듈
 *
 * @description
 * - ProblemController: REST API 엔드포인트 (CRUD + 필터링 + 페이지네이션)
 * - ProblemService: 비즈니스 로직 (캐시 관리, 정답 제외)
 * - ProblemRepository: Prisma 기반 데이터 접근 계층
 */
@Module({
  controllers: [ProblemController],
  providers: [ProblemService, ProblemRepository, LoggerService],
  exports: [ProblemService],
})
export class ProblemModule {}
