/**
 * 문제 컨트롤러
 *
 * 문제(Problem) CRUD REST API 엔드포인트를 제공합니다.
 *
 * @example
 * ```
 * POST   /api/v1/problems     - 문제 생성
 * GET    /api/v1/problems      - 문제 목록 (필터 + 페이지네이션)
 * GET    /api/v1/problems/:id  - 문제 상세
 * PATCH  /api/v1/problems/:id  - 문제 수정
 * DELETE /api/v1/problems/:id  - 문제 삭제
 * ```
 *
 * @module problem
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoggerService } from '../core/logger/logger.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemFilterDto } from './dto/problem-filter.dto';

@Controller('problems')
export class ProblemController {
  private readonly logger: LoggerService;

  constructor(
    private readonly problemService: ProblemService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('ProblemController');
  }

  /**
   * 문제를 생성합니다
   *
   * @param dto - 문제 생성 데이터
   * @returns 생성된 문제
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateProblemDto): Promise<ApiResponse> {
    this.logger.info('Create problem requested', { topicId: dto.topicId });
    const problem = await this.problemService.create(dto);
    return { success: true, data: problem };
  }

  /**
   * 문제 목록을 조회합니다 (answer, solution 제외)
   *
   * 필터링: topicId, objectiveId, difficultyMin/Max, type
   * 페이지네이션: page, limit
   *
   * @param filter - 필터 및 페이지네이션 조건
   * @returns 문제 목록과 메타 정보
   */
  @Get()
  async findMany(@Query() filter: ProblemFilterDto): Promise<ApiResponse> {
    const result = await this.problemService.findMany(filter);
    return { success: true, data: result.items, meta: result.meta };
  }

  /**
   * 문제 상세를 조회합니다 (answer, solution 포함)
   *
   * @param id - 문제 고유 식별자
   * @returns 문제 상세
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiResponse> {
    const problem = await this.problemService.findById(id);
    return { success: true, data: problem };
  }

  /**
   * 문제를 수정합니다
   *
   * @param id - 문제 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 문제
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProblemDto,
  ): Promise<ApiResponse> {
    const updated = await this.problemService.update(id, dto);
    return { success: true, data: updated };
  }

  /**
   * 문제를 삭제합니다 (Soft Delete)
   *
   * @param id - 문제 고유 식별자
   * @returns 삭제 성공 메시지
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse> {
    await this.problemService.delete(id);
    return { success: true, data: { message: 'Problem deleted successfully' } };
  }
}
