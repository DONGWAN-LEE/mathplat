/**
 * 업적 생성 DTO
 *
 * @module achievement/dto
 */

import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

/**
 * 업적 정의 생성 요청 DTO
 */
export class CreateAchievementDto {
  /** 업적 이름 (고유) */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 업적 설명 */
  @IsString()
  @IsNotEmpty()
  description: string;

  /** 아이콘 URL (선택적) */
  @IsOptional()
  @IsString()
  iconUrl?: string;

  /** 달성 조건 (JSON) */
  @IsNotEmpty()
  condition: any;

  /** XP 보상 */
  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;
}
