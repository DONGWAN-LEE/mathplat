/**
 * 업적 응답 DTO
 *
 * @module achievement/dto
 */

/**
 * 업적 정의 응답 DTO
 */
export class AchievementResponseDto {
  /** 업적 고유 식별자 */
  id: string;
  /** 업적 이름 */
  name: string;
  /** 업적 설명 */
  description: string;
  /** 아이콘 URL */
  iconUrl?: string;
  /** 달성 조건 */
  condition: any;
  /** XP 보상 */
  xpReward: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
}

/**
 * 사용자 달성 업적 응답 DTO
 */
export class UserAchievementResponseDto {
  /** 사용자 업적 고유 식별자 */
  id: string;
  /** 업적 정보 */
  achievement: AchievementResponseDto;
  /** 달성 시각 (ISO 8601) */
  earnedAt: string;
}
