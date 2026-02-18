/**
 * 사용자 통계 응답 DTO
 *
 * @module achievement/dto
 */

/**
 * 사용자 통계 응답 DTO
 */
export class StatsResponseDto {
  /** 통계 고유 식별자 */
  id: string;
  /** 사용자 ID */
  userId: string;
  /** 총 경험치 */
  totalXp: number;
  /** 레벨 */
  level: number;
  /** 현재 연속 학습일 */
  currentStreak: number;
  /** 최장 연속 학습일 */
  longestStreak: number;
  /** 총 풀이 문제 수 */
  totalProblemsSolved: number;
  /** 총 학습 시간 (초) */
  totalStudyTime: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}
