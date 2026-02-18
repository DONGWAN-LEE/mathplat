/**
 * 풀이 시도 응답 DTO
 *
 * @module attempt/dto
 */

/**
 * 풀이 시도 응답 DTO
 */
export class AttemptResponseDto {
  /** 시도 고유 식별자 */
  id: string;
  /** 사용자 ID */
  userId: string;
  /** 문제 ID */
  problemId: string;
  /** 정답 여부 (null: 미채점) */
  isCorrect: boolean | null;
  /** 제출 답안 */
  submittedAnswer: any;
  /** 풀이 시간 (초) */
  timeTaken: number;
  /** 시도 번호 */
  attemptNumber: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
}
