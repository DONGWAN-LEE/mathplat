/**
 * 학습 진도 모듈
 *
 * 학습 진도(UserProgress) 도메인에 필요한 컨트롤러, 서비스, 리포지토리를 등록합니다.
 *
 * @module progress
 */

import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { LoggerService } from '../core/logger/logger.service';

/**
 * 학습 진도 도메인 모듈
 *
 * @description
 * - ProgressController: REST API 엔드포인트 (내 진도 조회)
 * - ProgressService: 비즈니스 로직 (캐시 관리, 자동 upsert)
 * - ProgressRepository: Prisma 기반 데이터 접근 계층
 */
@Module({
  controllers: [ProgressController],
  providers: [ProgressService, ProgressRepository, LoggerService],
  exports: [ProgressService],
})
export class ProgressModule {}
