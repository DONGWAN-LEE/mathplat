/**
 * 교육과정 서비스
 *
 * 교육과정 계층(Curriculum → Chapter → Section → Topic → LearningObjective)의
 * 비즈니스 로직을 처리합니다. 캐시 우선 조회 및 하위 엔티티 변경 시
 * 상위 캐시 무효화 전략을 적용합니다.
 *
 * @module curriculum
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { CacheService } from '../core/cache/cache.service';
import { LoggerService } from '../core/logger/logger.service';
import { CACHE_KEYS, CACHE_TTL } from '../core/cache/cache-key.constants';
import { CreateCurriculumDto, CreateChapterDto, CreateSectionDto, CreateTopicDto, CreateObjectiveDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto, UpdateChapterDto, UpdateSectionDto, UpdateTopicDto, UpdateObjectiveDto } from './dto/update-curriculum.dto';

@Injectable()
export class CurriculumService {
  private readonly logger: LoggerService;

  constructor(
    private readonly curriculumRepository: CurriculumRepository,
    private readonly cacheService: CacheService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('CurriculumService');
  }

  // ──────────────────────────────────────────
  // Curriculum
  // ──────────────────────────────────────────

  /**
   * 교육과정을 생성합니다
   *
   * @param dto - 교육과정 생성 데이터
   * @returns 생성된 교육과정 엔티티
   */
  async createCurriculum(dto: CreateCurriculumDto) {
    const curriculum = await this.curriculumRepository.createCurriculum(dto);
    await this.invalidateCurriculumListCache();
    this.logger.info('Curriculum created', { curriculumId: curriculum.id });
    return curriculum;
  }

  /**
   * 교육과정 목록을 조회합니다
   *
   * 캐시 우선 조회를 적용합니다.
   *
   * @param grade - 학년 필터 (선택적)
   * @param semester - 학기 필터 (선택적)
   * @returns 교육과정 목록
   */
  async findCurriculumList(grade?: number, semester?: number) {
    const cacheKey = CACHE_KEYS.CURRICULUM_LIST(grade ?? 0, semester ?? 0);
    const cached = await this.cacheService.get<any[]>(cacheKey);

    if (cached) {
      this.logger.debug('Curriculum list found in cache');
      return cached;
    }

    const list = await this.curriculumRepository.findCurriculumList(grade, semester);
    await this.cacheService.set(cacheKey, list, CACHE_TTL.CURRICULUM_LIST);
    return list;
  }

  /**
   * 교육과정 상세를 조회합니다 (트리 구조 포함)
   *
   * 캐시 우선 조회를 적용합니다. 4단계 중첩 include로
   * chapters → sections → topics → objectives 전체 트리를 반환합니다.
   *
   * @param id - 교육과정 고유 식별자
   * @returns 교육과정 엔티티 (하위 트리 포함)
   * @throws NotFoundException 교육과정이 존재하지 않는 경우
   */
  async findCurriculumById(id: string) {
    const cacheKey = CACHE_KEYS.CURRICULUM(id);
    const cached = await this.cacheService.get<any>(cacheKey);

    if (cached) {
      this.logger.debug('Curriculum found in cache', { curriculumId: id });
      return cached;
    }

    const curriculum = await this.curriculumRepository.findCurriculumById(id);

    if (!curriculum) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Curriculum not found' },
      });
    }

    await this.cacheService.set(cacheKey, curriculum, CACHE_TTL.CURRICULUM);
    return curriculum;
  }

  /**
   * 교육과정을 수정합니다
   *
   * @param id - 교육과정 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 교육과정 엔티티
   * @throws NotFoundException 교육과정이 존재하지 않는 경우
   */
  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    const existing = await this.curriculumRepository.findCurriculumById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Curriculum not found' },
      });
    }

    const updated = await this.curriculumRepository.updateCurriculum(id, dto);
    await this.invalidateCurriculumCache(id);
    this.logger.info('Curriculum updated', { curriculumId: id });
    return updated;
  }

  /**
   * 교육과정을 소프트 삭제합니다
   *
   * @param id - 교육과정 고유 식별자
   * @returns 삭제된 교육과정 엔티티
   * @throws NotFoundException 교육과정이 존재하지 않는 경우
   */
  async deleteCurriculum(id: string) {
    const existing = await this.curriculumRepository.findCurriculumById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Curriculum not found' },
      });
    }

    const deleted = await this.curriculumRepository.softDeleteCurriculum(id);
    await this.invalidateCurriculumCache(id);
    this.logger.info('Curriculum deleted', { curriculumId: id });
    return deleted;
  }

  // ──────────────────────────────────────────
  // Chapter
  // ──────────────────────────────────────────

  /**
   * 챕터를 생성합니다
   *
   * @param curriculumId - 상위 교육과정 식별자
   * @param dto - 챕터 생성 데이터
   * @returns 생성된 챕터 엔티티
   * @throws NotFoundException 교육과정이 존재하지 않는 경우
   */
  async createChapter(curriculumId: string, dto: CreateChapterDto) {
    const curriculum = await this.curriculumRepository.findCurriculumById(curriculumId);
    if (!curriculum) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Curriculum not found' },
      });
    }

    const chapter = await this.curriculumRepository.createChapter(curriculumId, dto);
    await this.invalidateCurriculumCache(curriculumId);
    this.logger.info('Chapter created', { chapterId: chapter.id, curriculumId });
    return chapter;
  }

  /**
   * 챕터를 수정합니다
   *
   * @param id - 챕터 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 챕터 엔티티
   * @throws NotFoundException 챕터가 존재하지 않는 경우
   */
  async updateChapter(id: string, dto: UpdateChapterDto) {
    const existing = await this.curriculumRepository.findChapterById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Chapter not found' },
      });
    }

    const updated = await this.curriculumRepository.updateChapter(id, dto);
    await this.invalidateCurriculumCache(existing.curriculumId);
    this.logger.info('Chapter updated', { chapterId: id });
    return updated;
  }

  /**
   * 챕터를 소프트 삭제합니다
   *
   * @param id - 챕터 고유 식별자
   * @returns 삭제된 챕터 엔티티
   * @throws NotFoundException 챕터가 존재하지 않는 경우
   */
  async deleteChapter(id: string) {
    const existing = await this.curriculumRepository.findChapterById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Chapter not found' },
      });
    }

    const deleted = await this.curriculumRepository.softDeleteChapter(id);
    await this.invalidateCurriculumCache(existing.curriculumId);
    this.logger.info('Chapter deleted', { chapterId: id });
    return deleted;
  }

  // ──────────────────────────────────────────
  // Section
  // ──────────────────────────────────────────

  /**
   * 섹션을 생성합니다
   *
   * @param chapterId - 상위 챕터 식별자
   * @param dto - 섹션 생성 데이터
   * @returns 생성된 섹션 엔티티
   * @throws NotFoundException 챕터가 존재하지 않는 경우
   */
  async createSection(chapterId: string, dto: CreateSectionDto) {
    const chapter = await this.curriculumRepository.findChapterById(chapterId);
    if (!chapter) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Chapter not found' },
      });
    }

    const section = await this.curriculumRepository.createSection(chapterId, dto);
    await this.invalidateCurriculumCache(chapter.curriculumId);
    this.logger.info('Section created', { sectionId: section.id, chapterId });
    return section;
  }

  /**
   * 섹션을 수정합니다
   *
   * @param id - 섹션 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 섹션 엔티티
   * @throws NotFoundException 섹션이 존재하지 않는 경우
   */
  async updateSection(id: string, dto: UpdateSectionDto) {
    const existing = await this.curriculumRepository.findSectionById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Section not found' },
      });
    }

    const updated = await this.curriculumRepository.updateSection(id, dto);
    const chapter = await this.curriculumRepository.findChapterById(existing.chapterId);
    if (chapter) {
      await this.invalidateCurriculumCache(chapter.curriculumId);
    }
    this.logger.info('Section updated', { sectionId: id });
    return updated;
  }

  /**
   * 섹션을 소프트 삭제합니다
   *
   * @param id - 섹션 고유 식별자
   * @returns 삭제된 섹션 엔티티
   * @throws NotFoundException 섹션이 존재하지 않는 경우
   */
  async deleteSection(id: string) {
    const existing = await this.curriculumRepository.findSectionById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Section not found' },
      });
    }

    const deleted = await this.curriculumRepository.softDeleteSection(id);
    const chapter = await this.curriculumRepository.findChapterById(existing.chapterId);
    if (chapter) {
      await this.invalidateCurriculumCache(chapter.curriculumId);
    }
    this.logger.info('Section deleted', { sectionId: id });
    return deleted;
  }

  // ──────────────────────────────────────────
  // Topic
  // ──────────────────────────────────────────

  /**
   * 토픽을 생성합니다
   *
   * @param sectionId - 상위 섹션 식별자
   * @param dto - 토픽 생성 데이터
   * @returns 생성된 토픽 엔티티
   * @throws NotFoundException 섹션이 존재하지 않는 경우
   */
  async createTopic(sectionId: string, dto: CreateTopicDto) {
    const section = await this.curriculumRepository.findSectionById(sectionId);
    if (!section) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Section not found' },
      });
    }

    const topic = await this.curriculumRepository.createTopic(sectionId, dto);
    const chapter = await this.curriculumRepository.findChapterById(section.chapterId);
    if (chapter) {
      await this.invalidateCurriculumCache(chapter.curriculumId);
    }
    this.logger.info('Topic created', { topicId: topic.id, sectionId });
    return topic;
  }

  /**
   * 토픽을 수정합니다
   *
   * @param id - 토픽 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 토픽 엔티티
   * @throws NotFoundException 토픽이 존재하지 않는 경우
   */
  async updateTopic(id: string, dto: UpdateTopicDto) {
    const existing = await this.curriculumRepository.findTopicById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Topic not found' },
      });
    }

    const updated = await this.curriculumRepository.updateTopic(id, dto);
    await this.invalidateTopicParentCache(existing.sectionId);
    this.logger.info('Topic updated', { topicId: id });
    return updated;
  }

  /**
   * 토픽을 소프트 삭제합니다
   *
   * @param id - 토픽 고유 식별자
   * @returns 삭제된 토픽 엔티티
   * @throws NotFoundException 토픽이 존재하지 않는 경우
   */
  async deleteTopic(id: string) {
    const existing = await this.curriculumRepository.findTopicById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Topic not found' },
      });
    }

    const deleted = await this.curriculumRepository.softDeleteTopic(id);
    await this.invalidateTopicParentCache(existing.sectionId);
    this.logger.info('Topic deleted', { topicId: id });
    return deleted;
  }

  // ──────────────────────────────────────────
  // LearningObjective
  // ──────────────────────────────────────────

  /**
   * 학습목표를 생성합니다
   *
   * @param topicId - 상위 토픽 식별자
   * @param dto - 학습목표 생성 데이터
   * @returns 생성된 학습목표 엔티티
   * @throws NotFoundException 토픽이 존재하지 않는 경우
   */
  async createObjective(topicId: string, dto: CreateObjectiveDto) {
    const topic = await this.curriculumRepository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Topic not found' },
      });
    }

    const objective = await this.curriculumRepository.createObjective(topicId, dto);
    await this.invalidateTopicParentCache(topic.sectionId);
    this.logger.info('Objective created', { objectiveId: objective.id, topicId });
    return objective;
  }

  /**
   * 학습목표를 수정합니다
   *
   * @param id - 학습목표 고유 식별자
   * @param dto - 수정할 필드 데이터
   * @returns 수정된 학습목표 엔티티
   * @throws NotFoundException 학습목표가 존재하지 않는 경우
   */
  async updateObjective(id: string, dto: UpdateObjectiveDto) {
    const existing = await this.curriculumRepository.findObjectiveById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Learning objective not found' },
      });
    }

    const updated = await this.curriculumRepository.updateObjective(id, dto);
    const topic = await this.curriculumRepository.findTopicById(existing.topicId);
    if (topic) {
      await this.invalidateTopicParentCache(topic.sectionId);
    }
    this.logger.info('Objective updated', { objectiveId: id });
    return updated;
  }

  /**
   * 학습목표를 소프트 삭제합니다
   *
   * @param id - 학습목표 고유 식별자
   * @returns 삭제된 학습목표 엔티티
   * @throws NotFoundException 학습목표가 존재하지 않는 경우
   */
  async deleteObjective(id: string) {
    const existing = await this.curriculumRepository.findObjectiveById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_001', message: 'Learning objective not found' },
      });
    }

    const deleted = await this.curriculumRepository.softDeleteObjective(id);
    const topic = await this.curriculumRepository.findTopicById(existing.topicId);
    if (topic) {
      await this.invalidateTopicParentCache(topic.sectionId);
    }
    this.logger.info('Objective deleted', { objectiveId: id });
    return deleted;
  }

  // ──────────────────────────────────────────
  // Cache Invalidation
  // ──────────────────────────────────────────

  /**
   * 교육과정 관련 캐시를 무효화합니다
   *
   * @param curriculumId - 교육과정 고유 식별자
   */
  private async invalidateCurriculumCache(curriculumId: string): Promise<void> {
    await this.cacheService.del(CACHE_KEYS.CURRICULUM(curriculumId));
    await this.invalidateCurriculumListCache();
  }

  /**
   * 교육과정 목록 캐시를 무효화합니다
   *
   * curriculum_list:* 패턴의 모든 캐시를 삭제합니다.
   */
  private async invalidateCurriculumListCache(): Promise<void> {
    const keys = await this.cacheService.keys('curriculum_list:*');
    if (keys.length > 0) {
      await this.cacheService.del(...keys);
    }
  }

  /**
   * 토픽의 상위 교육과정 캐시를 무효화합니다
   *
   * section → chapter → curriculum 경로를 따라 캐시를 무효화합니다.
   *
   * @param sectionId - 섹션 고유 식별자
   */
  private async invalidateTopicParentCache(sectionId: string): Promise<void> {
    const section = await this.curriculumRepository.findSectionById(sectionId);
    if (section) {
      const chapter = await this.curriculumRepository.findChapterById(section.chapterId);
      if (chapter) {
        await this.invalidateCurriculumCache(chapter.curriculumId);
      }
    }
  }
}
