/**
 * 교육과정 리포지토리
 *
 * Prisma 기반의 교육과정 계층(Curriculum, Chapter, Section, Topic, LearningObjective)
 * 데이터 접근 계층입니다. Soft Delete 미들웨어가 전역 적용되어 있으므로
 * 별도의 deletedAt 필터링은 불필요합니다.
 *
 * @module curriculum
 */

import { Injectable } from '@nestjs/common';
import {
  Curriculum,
  Chapter,
  Section,
  Topic,
  LearningObjective,
} from '@prisma/client';
import { PrismaService } from '../core/database/prisma.service';

/**
 * 교육과정 데이터 접근 리포지토리
 */
@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // Curriculum CRUD
  // ──────────────────────────────────────────

  /**
   * 교육과정을 생성합니다
   *
   * @param data - 교육과정 생성 데이터
   * @returns 생성된 교육과정 엔티티
   */
  async createCurriculum(data: {
    name: string;
    grade: number;
    semester: number;
    subject?: string;
    orderIndex?: number;
  }): Promise<Curriculum> {
    return this.prisma.curriculum.create({ data });
  }

  /**
   * ID로 교육과정을 조회합니다 (트리 구조 포함)
   *
   * 4단계 중첩 include로 전체 트리를 반환합니다:
   * Curriculum → Chapters → Sections → Topics → Objectives
   *
   * @param id - 교육과정 고유 식별자
   * @returns 교육과정 엔티티 (하위 트리 포함) 또는 null
   */
  async findCurriculumById(id: string): Promise<Curriculum | null> {
    return this.prisma.curriculum.findFirst({
      where: { id, deletedAt: null },
      include: {
        chapters: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
          include: {
            sections: {
              where: { deletedAt: null },
              orderBy: { orderIndex: 'asc' },
              include: {
                topics: {
                  where: { deletedAt: null },
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    objectives: {
                      where: { deletedAt: null },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * 교육과정 목록을 조회합니다 (grade, semester 필터)
   *
   * @param grade - 학년 필터 (선택적)
   * @param semester - 학기 필터 (선택적)
   * @returns 교육과정 목록
   */
  async findCurriculumList(
    grade?: number,
    semester?: number,
  ): Promise<Curriculum[]> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (grade !== undefined) where.grade = grade;
    if (semester !== undefined) where.semester = semester;

    return this.prisma.curriculum.findMany({
      where,
      orderBy: [{ grade: 'asc' }, { semester: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  /**
   * 교육과정을 수정합니다
   *
   * @param id - 교육과정 고유 식별자
   * @param data - 수정할 필드
   * @returns 수정된 교육과정 엔티티
   */
  async updateCurriculum(
    id: string,
    data: Partial<{
      name: string;
      grade: number;
      semester: number;
      subject: string;
      orderIndex: number;
    }>,
  ): Promise<Curriculum> {
    return this.prisma.curriculum.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * 교육과정을 소프트 삭제합니다
   *
   * @param id - 교육과정 고유 식별자
   * @returns 삭제된 교육과정 엔티티
   */
  async softDeleteCurriculum(id: string): Promise<Curriculum> {
    return this.prisma.curriculum.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────
  // Chapter CRUD
  // ──────────────────────────────────────────

  /**
   * 챕터를 생성합니다
   *
   * @param curriculumId - 상위 교육과정 식별자
   * @param data - 챕터 생성 데이터
   * @returns 생성된 챕터 엔티티
   */
  async createChapter(
    curriculumId: string,
    data: { name: string; orderIndex?: number },
  ): Promise<Chapter> {
    return this.prisma.chapter.create({
      data: { ...data, curriculumId },
    });
  }

  /**
   * ID로 챕터를 조회합니다
   *
   * @param id - 챕터 고유 식별자
   * @returns 챕터 엔티티 또는 null
   */
  async findChapterById(id: string): Promise<Chapter | null> {
    return this.prisma.chapter.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * 챕터를 수정합니다
   *
   * @param id - 챕터 고유 식별자
   * @param data - 수정할 필드
   * @returns 수정된 챕터 엔티티
   */
  async updateChapter(
    id: string,
    data: Partial<{ name: string; orderIndex: number }>,
  ): Promise<Chapter> {
    return this.prisma.chapter.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * 챕터를 소프트 삭제합니다
   *
   * @param id - 챕터 고유 식별자
   * @returns 삭제된 챕터 엔티티
   */
  async softDeleteChapter(id: string): Promise<Chapter> {
    return this.prisma.chapter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────
  // Section CRUD
  // ──────────────────────────────────────────

  /**
   * 섹션을 생성합니다
   *
   * @param chapterId - 상위 챕터 식별자
   * @param data - 섹션 생성 데이터
   * @returns 생성된 섹션 엔티티
   */
  async createSection(
    chapterId: string,
    data: { name: string; orderIndex?: number },
  ): Promise<Section> {
    return this.prisma.section.create({
      data: { ...data, chapterId },
    });
  }

  /**
   * ID로 섹션을 조회합니다
   *
   * @param id - 섹션 고유 식별자
   * @returns 섹션 엔티티 또는 null
   */
  async findSectionById(id: string): Promise<Section | null> {
    return this.prisma.section.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * 섹션을 수정합니다
   *
   * @param id - 섹션 고유 식별자
   * @param data - 수정할 필드
   * @returns 수정된 섹션 엔티티
   */
  async updateSection(
    id: string,
    data: Partial<{ name: string; orderIndex: number }>,
  ): Promise<Section> {
    return this.prisma.section.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * 섹션을 소프트 삭제합니다
   *
   * @param id - 섹션 고유 식별자
   * @returns 삭제된 섹션 엔티티
   */
  async softDeleteSection(id: string): Promise<Section> {
    return this.prisma.section.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────
  // Topic CRUD
  // ──────────────────────────────────────────

  /**
   * 토픽을 생성합니다
   *
   * @param sectionId - 상위 섹션 식별자
   * @param data - 토픽 생성 데이터
   * @returns 생성된 토픽 엔티티
   */
  async createTopic(
    sectionId: string,
    data: { name: string; orderIndex?: number },
  ): Promise<Topic> {
    return this.prisma.topic.create({
      data: { ...data, sectionId },
    });
  }

  /**
   * ID로 토픽을 조회합니다
   *
   * @param id - 토픽 고유 식별자
   * @returns 토픽 엔티티 또는 null
   */
  async findTopicById(id: string): Promise<Topic | null> {
    return this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * 토픽을 수정합니다
   *
   * @param id - 토픽 고유 식별자
   * @param data - 수정할 필드
   * @returns 수정된 토픽 엔티티
   */
  async updateTopic(
    id: string,
    data: Partial<{ name: string; orderIndex: number }>,
  ): Promise<Topic> {
    return this.prisma.topic.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * 토픽을 소프트 삭제합니다
   *
   * @param id - 토픽 고유 식별자
   * @returns 삭제된 토픽 엔티티
   */
  async softDeleteTopic(id: string): Promise<Topic> {
    return this.prisma.topic.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────
  // LearningObjective CRUD
  // ──────────────────────────────────────────

  /**
   * 학습목표를 생성합니다
   *
   * @param topicId - 상위 토픽 식별자
   * @param data - 학습목표 생성 데이터
   * @returns 생성된 학습목표 엔티티
   */
  async createObjective(
    topicId: string,
    data: { description: string; bloomLevel?: string },
  ): Promise<LearningObjective> {
    return this.prisma.learningObjective.create({
      data: { ...data, topicId } as any,
    });
  }

  /**
   * ID로 학습목표를 조회합니다
   *
   * @param id - 학습목표 고유 식별자
   * @returns 학습목표 엔티티 또는 null
   */
  async findObjectiveById(id: string): Promise<LearningObjective | null> {
    return this.prisma.learningObjective.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * 학습목표를 수정합니다
   *
   * @param id - 학습목표 고유 식별자
   * @param data - 수정할 필드
   * @returns 수정된 학습목표 엔티티
   */
  async updateObjective(
    id: string,
    data: Partial<{ description: string; bloomLevel: string }>,
  ): Promise<LearningObjective> {
    return this.prisma.learningObjective.update({
      where: { id },
      data: { ...data, updatedAt: new Date() } as any,
    });
  }

  /**
   * 학습목표를 소프트 삭제합니다
   *
   * @param id - 학습목표 고유 식별자
   * @returns 삭제된 학습목표 엔티티
   */
  async softDeleteObjective(id: string): Promise<LearningObjective> {
    return this.prisma.learningObjective.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
