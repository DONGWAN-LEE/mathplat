/**
 * 업적 및 통계 컨트롤러
 *
 * 업적(Achievement)과 사용자 통계(Stats) REST API 엔드포인트를 제공합니다.
 *
 * @example
 * ```
 * POST /api/v1/achievements       - 업적 정의 생성 (관리자)
 * GET  /api/v1/achievements        - 전체 업적 목록
 * GET  /api/v1/achievements/me     - 내가 달성한 업적
 * GET  /api/v1/stats/me            - 내 통계
 * ```
 *
 * @module achievement
 */

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoggerService } from '../core/logger/logger.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { CreateAchievementDto } from './dto/create-achievement.dto';

/**
 * JWT 페이로드에서 추출되는 사용자 정보
 */
interface JwtPayloadUser {
  id: string;
  email: string;
}

@Controller()
export class AchievementController {
  private readonly logger: LoggerService;

  constructor(
    private readonly achievementService: AchievementService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('AchievementController');
  }

  /**
   * 업적 정의를 생성합니다 (관리자)
   *
   * @param dto - 업적 생성 데이터
   * @returns 생성된 업적
   */
  @Post('achievements')
  @UseGuards(JwtAuthGuard)
  async createAchievement(
    @Body() dto: CreateAchievementDto,
  ): Promise<ApiResponse> {
    this.logger.info('Create achievement requested', { name: dto.name });
    const achievement = await this.achievementService.createAchievement(dto);
    return { success: true, data: achievement };
  }

  /**
   * 전체 업적 목록을 조회합니다
   *
   * @returns 업적 목록
   */
  @Get('achievements')
  async findAllAchievements(): Promise<ApiResponse> {
    const achievements = await this.achievementService.findAllAchievements();
    return { success: true, data: achievements };
  }

  /**
   * 내가 달성한 업적 목록을 조회합니다
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @returns 달성 업적 목록
   */
  @Get('achievements/me')
  @UseGuards(JwtAuthGuard)
  async findMyAchievements(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<ApiResponse> {
    this.logger.info('My achievements requested', { userId: user.id });
    const achievements = await this.achievementService.findUserAchievements(user.id);
    return { success: true, data: achievements };
  }

  /**
   * 내 통계를 조회합니다
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @returns 사용자 통계
   */
  @Get('stats/me')
  @UseGuards(JwtAuthGuard)
  async findMyStats(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<ApiResponse> {
    this.logger.info('My stats requested', { userId: user.id });
    const stats = await this.achievementService.findStatsByUserId(user.id);
    return { success: true, data: stats };
  }
}
