/**
 * 교육과정 응답 DTO
 *
 * API 응답에서 교육과정 정보를 반환할 때 사용되는 데이터 전송 객체입니다.
 *
 * @module curriculum/dto
 */

/**
 * 학습목표 응답 DTO
 */
export class ObjectiveResponseDto {
  /** 학습목표 고유 식별자 */
  id: string;
  /** 학습목표 설명 */
  description: string;
  /** 블룸 수준 */
  bloomLevel: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}

/**
 * 토픽 응답 DTO
 */
export class TopicResponseDto {
  /** 토픽 고유 식별자 */
  id: string;
  /** 토픽 이름 */
  name: string;
  /** 정렬 순서 */
  orderIndex: number;
  /** 하위 학습목표 목록 */
  objectives?: ObjectiveResponseDto[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}

/**
 * 섹션 응답 DTO
 */
export class SectionResponseDto {
  /** 섹션 고유 식별자 */
  id: string;
  /** 섹션 이름 */
  name: string;
  /** 정렬 순서 */
  orderIndex: number;
  /** 하위 토픽 목록 */
  topics?: TopicResponseDto[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}

/**
 * 챕터 응답 DTO
 */
export class ChapterResponseDto {
  /** 챕터 고유 식별자 */
  id: string;
  /** 챕터 이름 */
  name: string;
  /** 정렬 순서 */
  orderIndex: number;
  /** 하위 섹션 목록 */
  sections?: SectionResponseDto[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}

/**
 * 교육과정 응답 DTO
 */
export class CurriculumResponseDto {
  /** 교육과정 고유 식별자 */
  id: string;
  /** 교육과정 이름 */
  name: string;
  /** 학년 */
  grade: number;
  /** 학기 */
  semester: number;
  /** 과목 */
  subject: string;
  /** 정렬 순서 */
  orderIndex: number;
  /** 하위 챕터 목록 */
  chapters?: ChapterResponseDto[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}
