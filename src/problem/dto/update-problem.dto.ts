/**
 * 문제 수정 DTO
 *
 * @module problem/dto
 */

import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ProblemType } from '@prisma/client';

/**
 * 문제 수정 요청 DTO
 */
export class UpdateProblemDto {
  /** 소단원(토픽) 고유 식별자 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  topicId?: string;

  /** 학습목표 고유 식별자 */
  @IsOptional()
  @IsString()
  objectiveId?: string;

  /** 문제 내용 */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  /** 문제 유형 */
  @IsOptional()
  @IsEnum(ProblemType)
  type?: ProblemType;

  /** 난이도 (1~10) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty?: number;

  /** 정답 (JSON) */
  @IsOptional()
  answer?: any;

  /** 풀이 (JSON) */
  @IsOptional()
  solution?: any;

  /** 힌트 (JSON) */
  @IsOptional()
  hints?: any;

  /** 개념 태그 (JSON) */
  @IsOptional()
  conceptTags?: any;

  /** 예상 풀이 시간 (초) */
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTime?: number;
}
