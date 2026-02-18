/**
 * 캐시 키 상수 정의
 *
 * ARCHITECTURE.md Section 6.1 캐시 키 패턴을 정의합니다.
 * 모든 캐시 키는 일관된 네이밍 컨벤션을 따르며,
 * 각 도메인별 키 생성 함수와 TTL 상수를 제공합니다.
 *
 * @example
 * ```typescript
 * const key = CACHE_KEYS.USER_INFO(userId);
 * await cacheService.set(key, userInfo, CACHE_TTL.USER_INFO);
 * ```
 */

/**
 * 캐시 키 생성 함수 모음
 *
 * 각 함수는 도메인별 캐시 키를 생성합니다.
 * 키 형식: `{도메인}:{식별자}` 패턴을 따릅니다.
 */
export const CACHE_KEYS = {
  /**
   * 사용자 정보 캐시 키를 생성합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 'user_info:{userId}' 형식의 캐시 키
   */
  USER_INFO: (userId: string) => `user_info:${userId}`,

  /**
   * 사용자 세션 캐시 키를 생성합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 'user_session:{userId}' 형식의 캐시 키
   */
  USER_SESSION: (userId: string) => `user_session:${userId}`,

  /**
   * 리프레시 토큰 캐시 키를 생성합니다
   *
   * @param tokenHash - 토큰 해시값
   * @returns 'refresh_token:{tokenHash}' 형식의 캐시 키
   */
  REFRESH_TOKEN: (tokenHash: string) => `refresh_token:${tokenHash}`,

  /**
   * Rate Limit 캐시 키를 생성합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param endpoint - API 엔드포인트 경로
   * @returns 'rate_limit:{userId}:{endpoint}' 형식의 캐시 키
   */
  RATE_LIMIT: (userId: string, endpoint: string) => `rate_limit:${userId}:${endpoint}`,

  /**
   * Socket.io 룸 캐시 키를 생성합니다
   *
   * @param roomId - 룸 고유 식별자
   * @returns 'socket_room:{roomId}' 형식의 캐시 키
   */
  SOCKET_ROOM: (roomId: string) => `socket_room:${roomId}`,

  /**
   * 세션 캐시 키를 생성합니다
   *
   * @param sessionId - 세션 고유 식별자
   * @returns 'session:{sessionId}' 형식의 캐시 키
   */
  SESSION: (sessionId: string) => `session:${sessionId}`,

  /**
   * 무효화된 세션 캐시 키를 생성합니다
   *
   * @param sessionId - 세션 고유 식별자
   * @returns 'session_invalid:{sessionId}' 형식의 캐시 키
   */
  SESSION_INVALID: (sessionId: string) => `session_invalid:${sessionId}`,

  /**
   * 교육과정 정보 캐시 키를 생성합니다
   *
   * @param curriculumId - 교육과정 고유 식별자
   * @returns 'curriculum:{curriculumId}' 형식의 캐시 키
   */
  CURRICULUM: (curriculumId: string) => `curriculum:${curriculumId}`,

  /**
   * 교육과정 목록 캐시 키를 생성합니다
   *
   * @param grade - 학년
   * @param semester - 학기
   * @returns 'curriculum_list:{grade}:{semester}' 형식의 캐시 키
   */
  CURRICULUM_LIST: (grade: number, semester: number) => `curriculum_list:${grade}:${semester}`,

  /**
   * 문제 정보 캐시 키를 생성합니다
   *
   * @param problemId - 문제 고유 식별자
   * @returns 'problem:{problemId}' 형식의 캐시 키
   */
  PROBLEM: (problemId: string) => `problem:${problemId}`,

  /**
   * 토픽별 문제 목록 캐시 키를 생성합니다
   *
   * @param topicId - 소단원 고유 식별자
   * @returns 'problem_list:{topicId}' 형식의 캐시 키
   */
  PROBLEM_LIST: (topicId: string) => `problem_list:${topicId}`,

  /**
   * 유저 진도 캐시 키를 생성합니다
   *
   * @param userId - 사용자 고유 식별자
   * @param topicId - 소단원 고유 식별자
   * @returns 'user_progress:{userId}:{topicId}' 형식의 캐시 키
   */
  USER_PROGRESS: (userId: string, topicId: string) => `user_progress:${userId}:${topicId}`,

  /**
   * 유저 통계 캐시 키를 생성합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 'user_stats:{userId}' 형식의 캐시 키
   */
  USER_STATS: (userId: string) => `user_stats:${userId}`,

  /**
   * 유저 성취 목록 캐시 키를 생성합니다
   *
   * @param userId - 사용자 고유 식별자
   * @returns 'user_achievements:{userId}' 형식의 캐시 키
   */
  USER_ACHIEVEMENTS: (userId: string) => `user_achievements:${userId}`,
} as const;

/**
 * 캐시 TTL(Time-To-Live) 상수 (초 단위)
 *
 * ARCHITECTURE.md Section 6.3 TTL 설정을 따릅니다.
 */
export const CACHE_TTL = {
  /** 사용자 정보: 1시간 */
  USER_INFO: 3600,

  /** 사용자 세션: 1시간 */
  USER_SESSION: 3600,

  /** 리프레시 토큰: 30일 */
  REFRESH_TOKEN: 2592000,

  /** Rate Limit: 1분 */
  RATE_LIMIT: 60,

  /** 세션: 30일 */
  SESSION: 2592000,

  /** 무효화된 세션: 24시간 */
  SESSION_INVALID: 86400,

  /** 교육과정: 24시간 */
  CURRICULUM: 86400,

  /** 교육과정 목록: 24시간 */
  CURRICULUM_LIST: 86400,

  /** 문제: 1시간 */
  PROBLEM: 3600,

  /** 토픽별 문제 목록: 1시간 */
  PROBLEM_LIST: 3600,

  /** 유저 진도: 30분 */
  USER_PROGRESS: 1800,

  /** 유저 통계: 30분 */
  USER_STATS: 1800,

  /** 유저 성취: 1시간 */
  USER_ACHIEVEMENTS: 3600,
} as const;
