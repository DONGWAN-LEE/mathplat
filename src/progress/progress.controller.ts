/**
 * 학습 진도 컨트롤러
 *
 * 학습 진도(UserProgress) REST API 엔드포인트를 제공합니다.
 *
 * @example
 * ```
 * GET /api/v1/progress/me                   - 내 전체 학습 진도
 * GET /api/v1/progress/me/topics/:topicId   - 특정 토픽 학습 진도
 * ```
 *
 * @module progress
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoggerService } from '../core/logger/logger.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';

/**
 * JWT 페이로드에서 추출되는 사용자 정보
 */
interface JwtPayloadUser {
  id: string;
  email: string;
}

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  private readonly logger: LoggerService;

  constructor(
    private readonly progressService: ProgressService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('ProgressController');
  }

  /**
   * 내 전체 학습 진도를 조회합니다
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @returns 학습 진도 목록
   */
  @Get('me')
  async findMyProgress(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<ApiResponse> {
    this.logger.info('Progress list requested', { userId: user.id });
    const progress = await this.progressService.findAllByUser(user.id);
    return { success: true, data: progress };
  }

  /**
   * 특정 토픽의 내 학습 진도를 조회합니다
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @param topicId - 토픽 고유 식별자
   * @returns 특정 토픽의 학습 진도
   */
  @Get('me/topics/:topicId')
  async findMyTopicProgress(
    @CurrentUser() user: JwtPayloadUser,
    @Param('topicId') topicId: string,
  ): Promise<ApiResponse> {
    const progress = await this.progressService.findByUserAndTopic(user.id, topicId);
    return { success: true, data: progress };
  }
}
