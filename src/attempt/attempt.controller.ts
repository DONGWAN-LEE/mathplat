/**
 * 풀이 시도 컨트롤러
 *
 * 답안 제출 및 풀이 이력 조회 REST API 엔드포인트를 제공합니다.
 *
 * @example
 * ```
 * POST /api/v1/attempts                          - 답안 제출 (자동 채점)
 * GET  /api/v1/attempts/me                        - 내 풀이 이력
 * GET  /api/v1/attempts/me/problems/:problemId    - 특정 문제 내 풀이 이력
 * ```
 *
 * @module attempt
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoggerService } from '../core/logger/logger.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

/**
 * JWT 페이로드에서 추출되는 사용자 정보
 */
interface JwtPayloadUser {
  id: string;
  email: string;
}

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptController {
  private readonly logger: LoggerService;

  constructor(
    private readonly attemptService: AttemptService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('AttemptController');
  }

  /**
   * 답안을 제출합니다 (자동 채점)
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @param dto - 답안 제출 데이터
   * @returns 채점 결과가 포함된 시도 엔티티
   */
  @Post()
  async submit(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: SubmitAttemptDto,
  ): Promise<ApiResponse> {
    this.logger.info('Attempt submission requested', {
      userId: user.id,
      problemId: dto.problemId,
    });
    const attempt = await this.attemptService.submit(user.id, dto);
    return { success: true, data: attempt };
  }

  /**
   * 내 풀이 이력을 조회합니다 (페이지네이션)
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @param page - 페이지 번호 (기본 1)
   * @param limit - 페이지 당 항목 수 (기본 20)
   * @returns 풀이 이력 목록과 메타 정보
   */
  @Get('me')
  async findMyAttempts(
    @CurrentUser() user: JwtPayloadUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await this.attemptService.findMyAttempts(
      user.id,
      isNaN(pageNum) ? 1 : pageNum,
      isNaN(limitNum) ? 20 : limitNum,
    );

    return { success: true, data: result.items, meta: result.meta };
  }

  /**
   * 특정 문제에 대한 내 풀이 이력을 조회합니다
   *
   * @param user - JWT 페이로드에서 추출된 사용자 정보
   * @param problemId - 문제 고유 식별자
   * @returns 특정 문제의 풀이 이력
   */
  @Get('me/problems/:problemId')
  async findMyProblemAttempts(
    @CurrentUser() user: JwtPayloadUser,
    @Param('problemId') problemId: string,
  ): Promise<ApiResponse> {
    const attempts = await this.attemptService.findMyProblemAttempts(
      user.id,
      problemId,
    );
    return { success: true, data: attempts };
  }
}
