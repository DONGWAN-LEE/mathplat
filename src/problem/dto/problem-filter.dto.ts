/**
 * 문제 필터링 DTO
 *
 * @module problem/dto
 */

import { IsString, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProblemType } from '@prisma/client';

/**
 * 문제 목록 필터 쿼리 DTO
 */
export class ProblemFilterDto {
  /** 소단원(토픽) ID 필터 */
  @IsOptional()
  @IsString()
  topicId?: string;

  /** 학습목표 ID 필터 */
  @IsOptional()
  @IsString()
  objectiveId?: string;

  /** 최소 난이도 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  difficultyMin?: number;

  /** 최대 난이도 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  difficultyMax?: number;

  /** 문제 유형 */
  @IsOptional()
  @IsEnum(ProblemType)
  type?: ProblemType;

  /** 페이지 번호 (기본 1) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** 페이지 당 항목 수 (기본 20) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
