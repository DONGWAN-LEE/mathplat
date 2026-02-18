/**
 * Prisma 시드 데이터 (standalone script)
 *
 * 개발 환경용 초기 데이터를 생성합니다.
 * - 테스트 유저 (dev@mathplat.com / password123)
 * - 교육과정 (초등 3학년 1학기 수학 샘플)
 * - 문제 5개 (객관식, 주관식)
 * - 배지 3개
 * - 유저 통계 초기화
 *
 * NOTE: 이 파일은 `npx prisma db seed`로 실행되는 독립 스크립트입니다.
 * NestJS 앱 외부에서 실행되므로 LoggerService 대신 console.log을 사용합니다.
 */

import { PrismaClient, ProblemType, BloomLevel } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * scrypt 기반 비밀번호 해싱 (src/common/utils.ts의 hashPassword와 동일한 형식)
 *
 * @param password - 평문 비밀번호
 * @returns salt:hash 형식의 문자열
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding database...');

  // 1. 테스트 유저
  const testUser = await prisma.user.upsert({
    where: { email: 'dev@mathplat.com' },
    update: { password: hashPassword('password123'), name: '개발자' },
    create: {
      email: 'dev@mathplat.com',
      password: hashPassword('password123'),
      name: '개발자',
      googleId: null,
    },
  });
  console.log(`User created: ${testUser.id} (${testUser.email})`);

  // 2. 교육과정: 초등 3학년 1학기 수학 (기존 데이터 정리 후 생성)
  await prisma.userProblemAttempt.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.learningObjective.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.curriculum.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.achievement.deleteMany({});

  const curriculum = await prisma.curriculum.create({
    data: {
      name: '초등 수학 3-1',
      grade: 3,
      semester: 1,
      subject: '수학',
      orderIndex: 1,
    },
  });

  // 대단원: 덧셈과 뺄셈
  const chapter = await prisma.chapter.create({
    data: {
      curriculumId: curriculum.id,
      name: '덧셈과 뺄셈',
      orderIndex: 1,
    },
  });

  // 중단원: 세 자리 수의 덧셈
  const section = await prisma.section.create({
    data: {
      chapterId: chapter.id,
      name: '세 자리 수의 덧셈',
      orderIndex: 1,
    },
  });

  // 소단원: 받아올림이 없는 세 자리 수의 덧셈
  const topic = await prisma.topic.create({
    data: {
      sectionId: section.id,
      name: '받아올림이 없는 세 자리 수의 덧셈',
      orderIndex: 1,
    },
  });

  // 학습 목표
  const objective = await prisma.learningObjective.create({
    data: {
      topicId: topic.id,
      description: '받아올림이 없는 세 자리 수의 덧셈을 할 수 있다.',
      bloomLevel: BloomLevel.APPLY,
    },
  });

  console.log(`Curriculum created: ${curriculum.name} > ${chapter.name} > ${section.name} > ${topic.name}`);

  // 3. 문제 5개
  const problems = await Promise.all([
    // 문제 1: 객관식
    prisma.problem.create({
      data: {
        topicId: topic.id,
        objectiveId: objective.id,
        content: '$123 + 456$의 값은 얼마입니까?',
        type: ProblemType.MULTIPLE_CHOICE,
        difficulty: 1,
        answer: { correct: 3, options: ['569', '570', '579', '589'] },
        solution: {
          steps: [
            { step: 1, description: '일의 자리: $3 + 6 = 9$' },
            { step: 2, description: '십의 자리: $2 + 5 = 7$' },
            { step: 3, description: '백의 자리: $1 + 4 = 5$' },
            { step: 4, description: '따라서 $123 + 456 = 579$' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 더해보세요.'] },
        conceptTags: ['세자리수덧셈', '받아올림없음'],
        estimatedTime: 60,
      },
    }),

    // 문제 2: 주관식
    prisma.problem.create({
      data: {
        topicId: topic.id,
        objectiveId: objective.id,
        content: '$234 + 512$를 계산하세요.',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 1,
        answer: { correct: '746' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리: $4 + 2 = 6$' },
            { step: 2, description: '십의 자리: $3 + 1 = 4$' },
            { step: 3, description: '백의 자리: $2 + 5 = 7$' },
            { step: 4, description: '따라서 $234 + 512 = 746$' },
          ],
        },
        conceptTags: ['세자리수덧셈', '받아올림없음'],
        estimatedTime: 45,
      },
    }),

    // 문제 3: 객관식 (난이도 2)
    prisma.problem.create({
      data: {
        topicId: topic.id,
        objectiveId: objective.id,
        content: '다음 중 $321 + 245$의 결과로 올바른 것은?',
        type: ProblemType.MULTIPLE_CHOICE,
        difficulty: 2,
        answer: { correct: 2, options: ['556', '566', '576', '665'] },
        solution: {
          steps: [
            { step: 1, description: '일의 자리: $1 + 5 = 6$' },
            { step: 2, description: '십의 자리: $2 + 4 = 6$' },
            { step: 3, description: '백의 자리: $3 + 2 = 5$' },
            { step: 4, description: '따라서 $321 + 245 = 566$' },
          ],
        },
        hints: { hints: ['각 자리 수를 따로 더해보세요.', '받아올림이 있는지 확인하세요.'] },
        conceptTags: ['세자리수덧셈', '받아올림없음'],
        estimatedTime: 60,
      },
    }),

    // 문제 4: 참/거짓
    prisma.problem.create({
      data: {
        topicId: topic.id,
        content: '$412 + 135 = 547$이다. 맞으면 O, 틀리면 X를 고르세요.',
        type: ProblemType.TRUE_FALSE,
        difficulty: 1,
        answer: { correct: true },
        solution: {
          steps: [
            { step: 1, description: '$412 + 135$를 계산합니다.' },
            { step: 2, description: '일의 자리: $2 + 5 = 7$' },
            { step: 3, description: '십의 자리: $1 + 3 = 4$' },
            { step: 4, description: '백의 자리: $4 + 1 = 5$' },
            { step: 5, description: '$412 + 135 = 547$ → 맞습니다 (O)' },
          ],
        },
        conceptTags: ['세자리수덧셈', '참거짓'],
        estimatedTime: 30,
      },
    }),

    // 문제 5: 빈칸 채우기 (난이도 3)
    prisma.problem.create({
      data: {
        topicId: topic.id,
        objectiveId: objective.id,
        content: '$2\\square3 + 314 = 547$에서 $\\square$에 들어갈 수를 구하세요.',
        type: ProblemType.FILL_IN_BLANK,
        difficulty: 3,
        answer: { correct: '3' },
        solution: {
          steps: [
            { step: 1, description: '$2\\square3 + 314 = 547$' },
            { step: 2, description: '일의 자리: $3 + 4 = 7$ ✓' },
            { step: 3, description: '십의 자리: $\\square + 1 = 4$ 이므로 $\\square = 3$' },
            { step: 4, description: '백의 자리: $2 + 3 = 5$ ✓' },
            { step: 5, description: '따라서 $\\square = 3$' },
          ],
        },
        hints: { hints: ['결과에서 거꾸로 생각해보세요.', '십의 자리를 살펴보세요.'] },
        conceptTags: ['세자리수덧셈', '역연산', '빈칸채우기'],
        estimatedTime: 90,
      },
    }),
  ]);

  console.log(`Problems created: ${problems.length}개`);

  // 4. 배지 3개
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: '첫 걸음',
        description: '첫 번째 문제를 풀었습니다! 수학 여행의 시작을 축하합니다.',
        condition: { type: 'problems_solved', count: 1 },
        xpReward: 10,
      },
    }),
    prisma.achievement.create({
      data: {
        name: '연습생',
        description: '문제를 10개 풀었습니다. 꾸준한 연습이 실력을 만듭니다!',
        condition: { type: 'problems_solved', count: 10 },
        xpReward: 50,
      },
    }),
    prisma.achievement.create({
      data: {
        name: '꾸준함의 힘',
        description: '3일 연속 학습했습니다. 꾸준함이 가장 큰 재능입니다!',
        condition: { type: 'streak', days: 3 },
        xpReward: 30,
      },
    }),
  ]);

  console.log(`Achievements created: ${achievements.length}개`);

  // 5. 유저 통계 초기화
  await prisma.userStats.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalProblemsSolved: 0,
      totalStudyTime: 0,
    },
  });

  console.log('User stats initialized');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
