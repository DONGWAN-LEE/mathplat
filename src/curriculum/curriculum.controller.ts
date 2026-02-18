/**
 * 교육과정 컨트롤러
 *
 * 교육과정 계층(Curriculum, Chapter, Section, Topic, LearningObjective)의
 * REST API 엔드포인트를 제공합니다.
 *
 * @example
 * ```
 * POST   /api/v1/curricula              - 교육과정 생성
 * GET    /api/v1/curricula              - 교육과정 목록
 * GET    /api/v1/curricula/:id          - 교육과정 상세
 * PATCH  /api/v1/curricula/:id          - 교육과정 수정
 * DELETE /api/v1/curricula/:id          - 교육과정 삭제
 * POST   /api/v1/curricula/:id/chapters - 챕터 생성
 * PATCH  /api/v1/chapters/:id           - 챕터 수정
 * DELETE /api/v1/chapters/:id           - 챕터 삭제
 * POST   /api/v1/chapters/:id/sections  - 섹션 생성
 * PATCH  /api/v1/sections/:id           - 섹션 수정
 * DELETE /api/v1/sections/:id           - 섹션 삭제
 * POST   /api/v1/sections/:id/topics    - 토픽 생성
 * PATCH  /api/v1/topics/:id             - 토픽 수정
 * DELETE /api/v1/topics/:id             - 토픽 삭제
 * POST   /api/v1/topics/:id/objectives  - 학습목표 생성
 * PATCH  /api/v1/objectives/:id         - 학습목표 수정
 * DELETE /api/v1/objectives/:id         - 학습목표 삭제
 * ```
 *
 * @module curriculum
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
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoggerService } from '../core/logger/logger.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import {
  CreateCurriculumDto,
  CreateChapterDto,
  CreateSectionDto,
  CreateTopicDto,
  CreateObjectiveDto,
} from './dto/create-curriculum.dto';
import {
  UpdateCurriculumDto,
  UpdateChapterDto,
  UpdateSectionDto,
  UpdateTopicDto,
  UpdateObjectiveDto,
} from './dto/update-curriculum.dto';

@Controller()
export class CurriculumController {
  private readonly logger: LoggerService;

  constructor(
    private readonly curriculumService: CurriculumService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('CurriculumController');
  }

  // ──────────────────────────────────────────
  // Curriculum Endpoints
  // ──────────────────────────────────────────

  /**
   * 교육과정을 생성합니다
   *
   * @param dto - 교육과정 생성 데이터
   * @returns 생성된 교육과정
   */
  @Post('curricula')
  @UseGuards(JwtAuthGuard)
  async createCurriculum(
    @Body() dto: CreateCurriculumDto,
  ): Promise<ApiResponse> {
    this.logger.info('Create curriculum requested', { name: dto.name });
    const curriculum = await this.curriculumService.createCurriculum(dto);
    return { success: true, data: curriculum };
  }

  /**
   * 교육과정 목록을 조회합니다
   *
   * @param grade - 학년 필터 (선택적)
   * @param semester - 학기 필터 (선택적)
   * @returns 교육과정 목록
   */
  @Get('curricula')
  async findCurriculumList(
    @Query('grade') grade?: string,
    @Query('semester') semester?: string,
  ): Promise<ApiResponse> {
    const gradeNum = grade ? parseInt(grade, 10) : undefined;
    const semesterNum = semester ? parseInt(semester, 10) : undefined;
    const list = await this.curriculumService.findCurriculumList(
      gradeNum !== undefined && !isNaN(gradeNum) ? gradeNum : undefined,
      semesterNum !== undefined && !isNaN(semesterNum) ? semesterNum : undefined,
    );
    return { success: true, data: list };
  }

  /**
   * 교육과정 상세를 조회합니다 (트리 구조 포함)
   *
   * @param id - 교육과정 고유 식별자
   * @returns 교육과정 상세 (하위 트리 포함)
   */
  @Get('curricula/:id')
  async findCurriculumById(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    const curriculum = await this.curriculumService.findCurriculumById(id);
    return { success: true, data: curriculum };
  }

  /**
   * 교육과정을 수정합니다
   *
   * @param id - 교육과정 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 교육과정
   */
  @Patch('curricula/:id')
  @UseGuards(JwtAuthGuard)
  async updateCurriculum(
    @Param('id') id: string,
    @Body() dto: UpdateCurriculumDto,
  ): Promise<ApiResponse> {
    const updated = await this.curriculumService.updateCurriculum(id, dto);
    return { success: true, data: updated };
  }

  /**
   * 교육과정을 삭제합니다 (Soft Delete)
   *
   * @param id - 교육과정 고유 식별자
   * @returns 삭제 성공 메시지
   */
  @Delete('curricula/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteCurriculum(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.curriculumService.deleteCurriculum(id);
    return { success: true, data: { message: 'Curriculum deleted successfully' } };
  }

  // ──────────────────────────────────────────
  // Chapter Endpoints
  // ──────────────────────────────────────────

  /**
   * 챕터를 생성합니다
   *
   * @param curriculumId - 상위 교육과정 식별자
   * @param dto - 챕터 생성 데이터
   * @returns 생성된 챕터
   */
  @Post('curricula/:id/chapters')
  @UseGuards(JwtAuthGuard)
  async createChapter(
    @Param('id') curriculumId: string,
    @Body() dto: CreateChapterDto,
  ): Promise<ApiResponse> {
    const chapter = await this.curriculumService.createChapter(curriculumId, dto);
    return { success: true, data: chapter };
  }

  /**
   * 챕터를 수정합니다
   *
   * @param id - 챕터 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 챕터
   */
  @Patch('chapters/:id')
  @UseGuards(JwtAuthGuard)
  async updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
  ): Promise<ApiResponse> {
    const updated = await this.curriculumService.updateChapter(id, dto);
    return { success: true, data: updated };
  }

  /**
   * 챕터를 삭제합니다 (Soft Delete)
   *
   * @param id - 챕터 고유 식별자
   * @returns 삭제 성공 메시지
   */
  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteChapter(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.curriculumService.deleteChapter(id);
    return { success: true, data: { message: 'Chapter deleted successfully' } };
  }

  // ──────────────────────────────────────────
  // Section Endpoints
  // ──────────────────────────────────────────

  /**
   * 섹션을 생성합니다
   *
   * @param chapterId - 상위 챕터 식별자
   * @param dto - 섹션 생성 데이터
   * @returns 생성된 섹션
   */
  @Post('chapters/:id/sections')
  @UseGuards(JwtAuthGuard)
  async createSection(
    @Param('id') chapterId: string,
    @Body() dto: CreateSectionDto,
  ): Promise<ApiResponse> {
    const section = await this.curriculumService.createSection(chapterId, dto);
    return { success: true, data: section };
  }

  /**
   * 섹션을 수정합니다
   *
   * @param id - 섹션 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 섹션
   */
  @Patch('sections/:id')
  @UseGuards(JwtAuthGuard)
  async updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ): Promise<ApiResponse> {
    const updated = await this.curriculumService.updateSection(id, dto);
    return { success: true, data: updated };
  }

  /**
   * 섹션을 삭제합니다 (Soft Delete)
   *
   * @param id - 섹션 고유 식별자
   * @returns 삭제 성공 메시지
   */
  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteSection(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.curriculumService.deleteSection(id);
    return { success: true, data: { message: 'Section deleted successfully' } };
  }

  // ──────────────────────────────────────────
  // Topic Endpoints
  // ──────────────────────────────────────────

  /**
   * 토픽을 생성합니다
   *
   * @param sectionId - 상위 섹션 식별자
   * @param dto - 토픽 생성 데이터
   * @returns 생성된 토픽
   */
  @Post('sections/:id/topics')
  @UseGuards(JwtAuthGuard)
  async createTopic(
    @Param('id') sectionId: string,
    @Body() dto: CreateTopicDto,
  ): Promise<ApiResponse> {
    const topic = await this.curriculumService.createTopic(sectionId, dto);
    return { success: true, data: topic };
  }

  /**
   * 토픽을 수정합니다
   *
   * @param id - 토픽 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 토픽
   */
  @Patch('topics/:id')
  @UseGuards(JwtAuthGuard)
  async updateTopic(
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ): Promise<ApiResponse> {
    const updated = await this.curriculumService.updateTopic(id, dto);
    return { success: true, data: updated };
  }

  /**
   * 토픽을 삭제합니다 (Soft Delete)
   *
   * @param id - 토픽 고유 식별자
   * @returns 삭제 성공 메시지
   */
  @Delete('topics/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteTopic(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.curriculumService.deleteTopic(id);
    return { success: true, data: { message: 'Topic deleted successfully' } };
  }

  // ──────────────────────────────────────────
  // LearningObjective Endpoints
  // ──────────────────────────────────────────

  /**
   * 학습목표를 생성합니다
   *
   * @param topicId - 상위 토픽 식별자
   * @param dto - 학습목표 생성 데이터
   * @returns 생성된 학습목표
   */
  @Post('topics/:id/objectives')
  @UseGuards(JwtAuthGuard)
  async createObjective(
    @Param('id') topicId: string,
    @Body() dto: CreateObjectiveDto,
  ): Promise<ApiResponse> {
    const objective = await this.curriculumService.createObjective(topicId, dto);
    return { success: true, data: objective };
  }

  /**
   * 학습목표를 수정합니다
   *
   * @param id - 학습목표 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 학습목표
   */
  @Patch('objectives/:id')
  @UseGuards(JwtAuthGuard)
  async updateObjective(
    @Param('id') id: string,
    @Body() dto: UpdateObjectiveDto,
  ): Promise<ApiResponse> {
    const updated = await this.curriculumService.updateObjective(id, dto);
    return { success: true, data: updated };
  }

  /**
   * 학습목표를 삭제합니다 (Soft Delete)
   *
   * @param id - 학습목표 고유 식별자
   * @returns 삭제 성공 메시지
   */
  @Delete('objectives/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteObjective(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.curriculumService.deleteObjective(id);
    return { success: true, data: { message: 'Learning objective deleted successfully' } };
  }
}
