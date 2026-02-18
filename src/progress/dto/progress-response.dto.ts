/**
 * 학습 진도 응답 DTO
 *
 * @module progress/dto
 */

/**
 * 학습 진도 응답 DTO
 */
export class ProgressResponseDto {
  /** 진도 고유 식별자 */
  id: string;
  /** 사용자 ID */
  userId: string;
  /** 토픽 ID */
  topicId: string;
  /** 숙련도 (0~1) */
  masteryLevel: number;
  /** 풀이한 문제 수 */
  problemsSolved: number;
  /** 정답 수 */
  correctCount: number;
  /** 토픽 정보 (선택적) */
  topic?: {
    id: string;
    name: string;
    sectionId: string;
  };
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
}
