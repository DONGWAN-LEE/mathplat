/**
 * 문제 응답 DTO
 *
 * @module problem/dto
 */

/**
 * 문제 목록 응답 DTO (answer, solution 제외)
 */
export class ProblemListResponseDto {
  /** 문제 고유 식별자 */
  id: string;
  /** 소단원 ID */
  topicId: string;
  /** 학습목표 ID */
  objectiveId?: string;
  /** 문제 내용 */
  content: string;
  /** 문제 유형 */
  type: string;
  /** 난이도 */
  difficulty: number;
  /** 힌트 */
  hints?: any;
  /** 개념 태그 */
  conceptTags?: any;
  /** 예상 풀이 시간 */
  estimatedTime: number;
  /** 풀이 수 */
  solveCount: number;
  /** 정답률 */
  correctRate: number;
  /** 생성 시각 */
  createdAt: string;
  /** 수정 시각 */
  updatedAt: string;
}

/**
 * 문제 상세 응답 DTO (answer, solution 포함)
 */
export class ProblemDetailResponseDto extends ProblemListResponseDto {
  /** 정답 */
  answer: any;
  /** 풀이 */
  solution: any;
}
