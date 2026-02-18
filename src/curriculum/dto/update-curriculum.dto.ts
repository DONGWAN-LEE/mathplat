/**
 * 교육과정 수정 DTO
 *
 * 교육과정 및 하위 엔티티 수정 시 사용되는 데이터 전송 객체입니다.
 * 모든 필드가 선택적입니다.
 *
 * @module curriculum/dto
 */

import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { BloomLevel } from '@prisma/client';

/**
 * 교육과정 수정 요청 DTO
 */
export class UpdateCurriculumDto {
  /** 교육과정 이름 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /** 학년 (1~12) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  grade?: number;

  /** 학기 (1~2) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  semester?: number;

  /** 과목 */
  @IsOptional()
  @IsString()
  subject?: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 챕터 수정 요청 DTO
 */
export class UpdateChapterDto {
  /** 챕터 이름 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 섹션 수정 요청 DTO
 */
export class UpdateSectionDto {
  /** 섹션 이름 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 토픽 수정 요청 DTO
 */
export class UpdateTopicDto {
  /** 토픽 이름 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 학습목표 수정 요청 DTO
 */
export class UpdateObjectiveDto {
  /** 학습목표 설명 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  /** 블룸 수준 */
  @IsOptional()
  @IsEnum(BloomLevel)
  bloomLevel?: BloomLevel;
}
