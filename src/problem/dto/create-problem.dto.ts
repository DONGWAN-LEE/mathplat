/**
 * 문제 생성 DTO
 *
 * @module problem/dto
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ProblemType } from '@prisma/client';

/**
 * 문제 생성 요청 DTO
 */
export class CreateProblemDto {
  /** 소단원(토픽) 고유 식별자 */
  @IsString()
  @IsNotEmpty()
  topicId: string;

  /** 학습목표 고유 식별자 (선택적) */
  @IsOptional()
  @IsString()
  objectiveId?: string;

  /** 문제 내용 (HTML/LaTeX 지원) */
  @IsString()
  @IsNotEmpty()
  content: string;

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
  @IsNotEmpty()
  answer: any;

  /** 풀이 (JSON) */
  @IsNotEmpty()
  solution: any;

  /** 힌트 (JSON, 선택적) */
  @IsOptional()
  hints?: any;

  /** 개념 태그 (JSON, 선택적) */
  @IsOptional()
  conceptTags?: any;

  /** 예상 풀이 시간 (초, 기본 60) */
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTime?: number;
}
