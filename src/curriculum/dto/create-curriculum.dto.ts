/**
 * 교육과정 생성 DTO
 *
 * 교육과정 및 하위 엔티티(챕터, 섹션, 토픽, 학습목표) 생성 시
 * 사용되는 데이터 전송 객체입니다.
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
 * 교육과정 생성 요청 DTO
 */
export class CreateCurriculumDto {
  /** 교육과정 이름 */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 학년 (1~12) */
  @IsInt()
  @Min(1)
  @Max(12)
  grade: number;

  /** 학기 (1~2) */
  @IsInt()
  @Min(1)
  @Max(2)
  semester: number;

  /** 과목 (기본: 수학) */
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
 * 챕터 생성 요청 DTO
 */
export class CreateChapterDto {
  /** 챕터 이름 */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 섹션 생성 요청 DTO
 */
export class CreateSectionDto {
  /** 섹션 이름 */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 토픽 생성 요청 DTO
 */
export class CreateTopicDto {
  /** 토픽 이름 */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 정렬 순서 */
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * 학습목표 생성 요청 DTO
 */
export class CreateObjectiveDto {
  /** 학습목표 설명 */
  @IsString()
  @IsNotEmpty()
  description: string;

  /** 블룸 수준 */
  @IsOptional()
  @IsEnum(BloomLevel)
  bloomLevel?: BloomLevel;
}
