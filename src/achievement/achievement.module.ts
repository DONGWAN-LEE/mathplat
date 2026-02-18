/**
 * 업적 모듈
 *
 * 업적(Achievement), 사용자 업적(UserAchievement), 사용자 통계(UserStats) 관리에
 * 필요한 컨트롤러, 서비스, 리포지토리를 등록합니다.
 *
 * @module achievement
 */

import { Module } from '@nestjs/common';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import { AchievementRepository } from './achievement.repository';
import { LoggerService } from '../core/logger/logger.service';

/**
 * 업적 도메인 모듈
 *
 * @description
 * - AchievementController: REST API 엔드포인트 (업적 CRUD, 통계 조회)
 * - AchievementService: 비즈니스 로직 (XP/레벨, 스트릭, 업적 조건 평가)
 * - AchievementRepository: Prisma 기반 데이터 접근 계층
 */
@Module({
  controllers: [AchievementController],
  providers: [AchievementService, AchievementRepository, LoggerService],
  exports: [AchievementService],
})
export class AchievementModule {}
