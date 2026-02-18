/**
 * 답안 제출 DTO
 *
 * @module attempt/dto
 */

import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

/**
 * 답안 제출 요청 DTO
 */
export class SubmitAttemptDto {
  /** 문제 고유 식별자 */
  @IsString()
  @IsNotEmpty()
  problemId: string;

  /** 제출 답안 (JSON) */
  @IsNotEmpty()
  submittedAnswer: any;

  /** 풀이 시간 (초) */
  @IsOptional()
  @IsInt()
  @Min(0)
  timeTaken?: number;
}
