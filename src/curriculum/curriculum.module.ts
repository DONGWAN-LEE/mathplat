/**
 * 교육과정 모듈
 *
 * 교육과정 계층(Curriculum, Chapter, Section, Topic, LearningObjective) 관리에
 * 필요한 컨트롤러, 서비스, 리포지토리를 등록합니다.
 *
 * @module curriculum
 */

import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { CurriculumRepository } from './curriculum.repository';
import { LoggerService } from '../core/logger/logger.service';

/**
 * 교육과정 도메인 모듈
 *
 * @description
 * - CurriculumController: REST API 엔드포인트 (CRUD for 5 entities)
 * - CurriculumService: 비즈니스 로직 (캐시 관리, 트리 조회)
 * - CurriculumRepository: Prisma 기반 데이터 접근 계층
 */
@Module({
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumRepository, LoggerService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
