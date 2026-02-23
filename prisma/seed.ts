/**
 * Prisma 시드 데이터 (standalone script)
 *
 * 개발 환경용 초기 데이터를 생성합니다.
 * - 테스트 유저 (dev@mathplat.com / password123)
 * - 교육과정 (초등 3학년 1학기 수학 - 비바샘 교과서 기준)
 * - 문제 20개 (4개 소단원 x 5문제, 한국 교과서 형식)
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

  // ── 중단원 1: 세 자리 수의 덧셈 ──
  const sectionAdd = await prisma.section.create({
    data: {
      chapterId: chapter.id,
      name: '세 자리 수의 덧셈',
      orderIndex: 1,
    },
  });

  // 소단원 1: 받아올림이 없는 세 자리 수의 덧셈
  const topic1 = await prisma.topic.create({
    data: {
      sectionId: sectionAdd.id,
      name: '받아올림이 없는 세 자리 수의 덧셈',
      orderIndex: 1,
    },
  });

  const objective1 = await prisma.learningObjective.create({
    data: {
      topicId: topic1.id,
      description: '받아올림이 없는 세 자리 수의 덧셈을 할 수 있다.',
      bloomLevel: BloomLevel.APPLY,
    },
  });

  // 소단원 2: 받아올림이 있는 세 자리 수의 덧셈
  const topic2 = await prisma.topic.create({
    data: {
      sectionId: sectionAdd.id,
      name: '받아올림이 있는 세 자리 수의 덧셈',
      orderIndex: 2,
    },
  });

  const objective2 = await prisma.learningObjective.create({
    data: {
      topicId: topic2.id,
      description: '받아올림이 있는 세 자리 수의 덧셈을 할 수 있다.',
      bloomLevel: BloomLevel.APPLY,
    },
  });

  // ── 중단원 2: 세 자리 수의 뺄셈 ──
  const sectionSub = await prisma.section.create({
    data: {
      chapterId: chapter.id,
      name: '세 자리 수의 뺄셈',
      orderIndex: 2,
    },
  });

  // 소단원 3: 받아내림이 없는 세 자리 수의 뺄셈
  const topic3 = await prisma.topic.create({
    data: {
      sectionId: sectionSub.id,
      name: '받아내림이 없는 세 자리 수의 뺄셈',
      orderIndex: 1,
    },
  });

  const objective3 = await prisma.learningObjective.create({
    data: {
      topicId: topic3.id,
      description: '받아내림이 없는 세 자리 수의 뺄셈을 할 수 있다.',
      bloomLevel: BloomLevel.APPLY,
    },
  });

  // 소단원 4: 받아내림이 있는 세 자리 수의 뺄셈
  const topic4 = await prisma.topic.create({
    data: {
      sectionId: sectionSub.id,
      name: '받아내림이 있는 세 자리 수의 뺄셈',
      orderIndex: 2,
    },
  });

  const objective4 = await prisma.learningObjective.create({
    data: {
      topicId: topic4.id,
      description: '받아내림이 있는 세 자리 수의 뺄셈을 할 수 있다.',
      bloomLevel: BloomLevel.APPLY,
    },
  });

  console.log(`Curriculum created: ${curriculum.name} > ${chapter.name}`);
  console.log(`  Section 1: ${sectionAdd.name} > ${topic1.name}, ${topic2.name}`);
  console.log(`  Section 2: ${sectionSub.name} > ${topic3.name}, ${topic4.name}`);

  // ════════════════════════════════════════════════
  // 3. 문제 20개 (4개 소단원 x 5문제)
  // ════════════════════════════════════════════════

  const problems = await Promise.all([
    // ── 소단원 1: 받아올림이 없는 세 자리 수의 덧셈 (문제 1~5) ──

    // 문제 1: 객관식
    prisma.problem.create({
      data: {
        topicId: topic1.id,
        objectiveId: objective1.id,
        content: '계산 결과로 알맞은 것을 고르세요.\n\n243 + 516',
        type: ProblemType.MULTIPLE_CHOICE,
        difficulty: 1,
        answer: { correct: 3, options: ['749', '769', '759', '758'] },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 더합니다. 3 + 6 = 9' },
            { step: 2, description: '십의 자리끼리 더합니다. 4 + 1 = 5' },
            { step: 3, description: '백의 자리끼리 더합니다. 2 + 5 = 7' },
            { step: 4, description: '따라서 243 + 516 = 759입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '받아올림 없는 덧셈'],
        estimatedTime: 60,
      },
    }),

    // 문제 2: 주관식
    prisma.problem.create({
      data: {
        topicId: topic1.id,
        objectiveId: objective1.id,
        content: '계산해 보세요.\n\n351 + 426',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 1,
        answer: { correct: '777' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 더합니다. 1 + 6 = 7' },
            { step: 2, description: '십의 자리끼리 더합니다. 5 + 2 = 7' },
            { step: 3, description: '백의 자리끼리 더합니다. 3 + 4 = 7' },
            { step: 4, description: '따라서 351 + 426 = 777입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '받아올림 없는 덧셈'],
        estimatedTime: 45,
      },
    }),

    // 문제 3: 빈칸 채우기
    prisma.problem.create({
      data: {
        topicId: topic1.id,
        objectiveId: objective1.id,
        content: '□에 알맞은 수를 구하세요.\n\n2□4 + 315 = 569',
        type: ProblemType.FILL_IN_BLANK,
        difficulty: 2,
        answer: { correct: '5' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리를 확인합니다. 4 + 5 = 9 ✓' },
            { step: 2, description: '십의 자리를 확인합니다. □ + 1 = 6이므로 □ = 5' },
            { step: 3, description: '백의 자리를 확인합니다. 2 + 3 = 5 ✓' },
            { step: 4, description: '따라서 □에 알맞은 수는 5입니다.' },
          ],
        },
        hints: { hints: ['각 자리의 계산 결과를 비교해 보세요.', '십의 자리를 살펴보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '□에 알맞은 수'],
        estimatedTime: 90,
      },
    }),

    // 문제 4: 참/거짓
    prisma.problem.create({
      data: {
        topicId: topic1.id,
        objectiveId: objective1.id,
        content: '다음 계산이 맞으면 ○, 틀리면 ×를 쓰세요.\n\n412 + 135 = 547',
        type: ProblemType.TRUE_FALSE,
        difficulty: 1,
        answer: { correct: true },
        solution: {
          steps: [
            { step: 1, description: '직접 계산하여 확인합니다.' },
            { step: 2, description: '일의 자리끼리 더합니다. 2 + 5 = 7 ✓' },
            { step: 3, description: '십의 자리끼리 더합니다. 1 + 3 = 4 ✓' },
            { step: 4, description: '백의 자리끼리 더합니다. 4 + 1 = 5 ✓' },
            { step: 5, description: '412 + 135 = 547이므로 계산이 맞습니다. ○' },
          ],
        },
        hints: { hints: ['직접 계산해서 결과를 비교해 보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '계산 검증'],
        estimatedTime: 30,
      },
    }),

    // 문제 5: 문장제
    prisma.problem.create({
      data: {
        topicId: topic1.id,
        objectiveId: objective1.id,
        content: '민수는 색종이를 231장 가지고 있고, 지연이는 345장 가지고 있습니다. 두 사람이 가지고 있는 색종이는 모두 몇 장인지 구하세요.',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 2,
        answer: { correct: '576' },
        solution: {
          steps: [
            { step: 1, description: '구하려는 것: 두 사람이 가지고 있는 색종이의 전체 수' },
            { step: 2, description: '주어진 조건: 민수 231장, 지연이 345장' },
            { step: 3, description: '풀이: 231 + 345 = 576' },
            { step: 4, description: '따라서 두 사람이 가지고 있는 색종이는 모두 576장입니다.' },
          ],
        },
        hints: { hints: ['두 사람의 색종이를 합하면 됩니다.', '231 + 345를 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '받아올림 없는 덧셈', '문장제'],
        estimatedTime: 90,
      },
    }),

    // ── 소단원 2: 받아올림이 있는 세 자리 수의 덧셈 (문제 6~10) ──

    // 문제 6: 주관식
    prisma.problem.create({
      data: {
        topicId: topic2.id,
        objectiveId: objective2.id,
        content: '계산해 보세요.\n\n367 + 258',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 2,
        answer: { correct: '625' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 더합니다. 7 + 8 = 15이므로 5를 쓰고 1을 받아올림합니다.' },
            { step: 2, description: '십의 자리끼리 더합니다. 6 + 5 + 1(받아올림) = 12이므로 2를 쓰고 1을 받아올림합니다.' },
            { step: 3, description: '백의 자리끼리 더합니다. 3 + 2 + 1(받아올림) = 6' },
            { step: 4, description: '따라서 367 + 258 = 625입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.', '받아올림이 있는지 확인해 보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '받아올림 있는 덧셈'],
        estimatedTime: 60,
      },
    }),

    // 문제 7: 객관식
    prisma.problem.create({
      data: {
        topicId: topic2.id,
        objectiveId: objective2.id,
        content: '계산 결과로 알맞은 것을 고르세요.\n\n475 + 368',
        type: ProblemType.MULTIPLE_CHOICE,
        difficulty: 2,
        answer: { correct: 2, options: ['833', '843', '834', '853'] },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 더합니다. 5 + 8 = 13이므로 3을 쓰고 1을 받아올림합니다.' },
            { step: 2, description: '십의 자리끼리 더합니다. 7 + 6 + 1(받아올림) = 14이므로 4를 쓰고 1을 받아올림합니다.' },
            { step: 3, description: '백의 자리끼리 더합니다. 4 + 3 + 1(받아올림) = 8' },
            { step: 4, description: '따라서 475 + 368 = 843입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.', '받아올림을 빠뜨리지 않도록 주의하세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '받아올림 있는 덧셈'],
        estimatedTime: 60,
      },
    }),

    // 문제 8: 빈칸 채우기
    prisma.problem.create({
      data: {
        topicId: topic2.id,
        objectiveId: objective2.id,
        content: '□에 알맞은 수를 구하세요.\n\n3□7 + 285 = 652',
        type: ProblemType.FILL_IN_BLANK,
        difficulty: 3,
        answer: { correct: '6' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리를 확인합니다. 7 + 5 = 12이므로 2를 쓰고 1을 받아올림합니다. ✓' },
            { step: 2, description: '십의 자리를 확인합니다. □ + 8 + 1(받아올림) = 15이므로 □ + 9 = 15, □ = 6' },
            { step: 3, description: '백의 자리를 확인합니다. 3 + 2 + 1(받아올림) = 6 ✓' },
            { step: 4, description: '따라서 □에 알맞은 수는 6입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 확인해 보세요.', '받아올림을 생각하며 십의 자리를 살펴보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '□에 알맞은 수', '받아올림 있는 덧셈'],
        estimatedTime: 120,
      },
    }),

    // 문제 9: 문장제
    prisma.problem.create({
      data: {
        topicId: topic2.id,
        objectiveId: objective2.id,
        content: '도서관에 동화책이 276권, 과학책이 358권 있습니다. 동화책과 과학책은 모두 몇 권인지 구하세요.',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 2,
        answer: { correct: '634' },
        solution: {
          steps: [
            { step: 1, description: '구하려는 것: 동화책과 과학책의 전체 수' },
            { step: 2, description: '주어진 조건: 동화책 276권, 과학책 358권' },
            { step: 3, description: '풀이: 276 + 358 = 634' },
            { step: 4, description: '따라서 동화책과 과학책은 모두 634권입니다.' },
          ],
        },
        hints: { hints: ['두 종류의 책을 합하면 됩니다.', '276 + 358을 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '받아올림 있는 덧셈', '문장제'],
        estimatedTime: 90,
      },
    }),

    // 문제 10: 참/거짓
    prisma.problem.create({
      data: {
        topicId: topic2.id,
        objectiveId: objective2.id,
        content: '다음 계산이 맞으면 ○, 틀리면 ×를 쓰세요.\n\n489 + 237 = 716',
        type: ProblemType.TRUE_FALSE,
        difficulty: 2,
        answer: { correct: false },
        solution: {
          steps: [
            { step: 1, description: '직접 계산하여 확인합니다.' },
            { step: 2, description: '일의 자리끼리 더합니다. 9 + 7 = 16이므로 6을 쓰고 1을 받아올림합니다.' },
            { step: 3, description: '십의 자리끼리 더합니다. 8 + 3 + 1(받아올림) = 12이므로 2를 쓰고 1을 받아올림합니다.' },
            { step: 4, description: '백의 자리끼리 더합니다. 4 + 2 + 1(받아올림) = 7' },
            { step: 5, description: '489 + 237 = 726인데 716이라고 했으므로 틀렸습니다. ×' },
          ],
        },
        hints: { hints: ['직접 계산해서 결과를 비교해 보세요.', '받아올림을 빠뜨리지 않도록 주의하세요.'] },
        conceptTags: ['세 자리 수의 덧셈', '계산 검증', '받아올림 있는 덧셈'],
        estimatedTime: 45,
      },
    }),

    // ── 소단원 3: 받아내림이 없는 세 자리 수의 뺄셈 (문제 11~15) ──

    // 문제 11: 주관식
    prisma.problem.create({
      data: {
        topicId: topic3.id,
        objectiveId: objective3.id,
        content: '계산해 보세요.\n\n786 - 253',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 1,
        answer: { correct: '533' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 뺍니다. 6 - 3 = 3' },
            { step: 2, description: '십의 자리끼리 뺍니다. 8 - 5 = 3' },
            { step: 3, description: '백의 자리끼리 뺍니다. 7 - 2 = 5' },
            { step: 4, description: '따라서 786 - 253 = 533입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '받아내림 없는 뺄셈'],
        estimatedTime: 45,
      },
    }),

    // 문제 12: 객관식
    prisma.problem.create({
      data: {
        topicId: topic3.id,
        objectiveId: objective3.id,
        content: '계산 결과로 알맞은 것을 고르세요.\n\n695 - 432',
        type: ProblemType.MULTIPLE_CHOICE,
        difficulty: 1,
        answer: { correct: 3, options: ['253', '273', '263', '262'] },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 뺍니다. 5 - 2 = 3' },
            { step: 2, description: '십의 자리끼리 뺍니다. 9 - 3 = 6' },
            { step: 3, description: '백의 자리끼리 뺍니다. 6 - 4 = 2' },
            { step: 4, description: '따라서 695 - 432 = 263입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '받아내림 없는 뺄셈'],
        estimatedTime: 60,
      },
    }),

    // 문제 13: 빈칸 채우기
    prisma.problem.create({
      data: {
        topicId: topic3.id,
        objectiveId: objective3.id,
        content: '□에 알맞은 수를 구하세요.\n\n8□9 - 315 = 524',
        type: ProblemType.FILL_IN_BLANK,
        difficulty: 2,
        answer: { correct: '3' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리를 확인합니다. 9 - 5 = 4 ✓' },
            { step: 2, description: '십의 자리를 확인합니다. □ - 1 = 2이므로 □ = 3' },
            { step: 3, description: '백의 자리를 확인합니다. 8 - 3 = 5 ✓' },
            { step: 4, description: '따라서 □에 알맞은 수는 3입니다.' },
          ],
        },
        hints: { hints: ['각 자리의 계산 결과를 비교해 보세요.', '십의 자리를 살펴보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '□에 알맞은 수'],
        estimatedTime: 90,
      },
    }),

    // 문제 14: 문장제
    prisma.problem.create({
      data: {
        topicId: topic3.id,
        objectiveId: objective3.id,
        content: '과수원에 사과가 568개 있었습니다. 그중 325개를 팔았습니다. 남은 사과는 몇 개인지 구하세요.',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 2,
        answer: { correct: '243' },
        solution: {
          steps: [
            { step: 1, description: '구하려는 것: 남은 사과의 수' },
            { step: 2, description: '주어진 조건: 처음 568개, 판 것 325개' },
            { step: 3, description: '풀이: 568 - 325 = 243' },
            { step: 4, description: '따라서 남은 사과는 243개입니다.' },
          ],
        },
        hints: { hints: ['전체에서 판 것을 빼면 됩니다.', '568 - 325를 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '받아내림 없는 뺄셈', '문장제'],
        estimatedTime: 90,
      },
    }),

    // 문제 15: 참/거짓
    prisma.problem.create({
      data: {
        topicId: topic3.id,
        objectiveId: objective3.id,
        content: '다음 계산이 맞으면 ○, 틀리면 ×를 쓰세요.\n\n987 - 654 = 333',
        type: ProblemType.TRUE_FALSE,
        difficulty: 1,
        answer: { correct: true },
        solution: {
          steps: [
            { step: 1, description: '직접 계산하여 확인합니다.' },
            { step: 2, description: '일의 자리끼리 뺍니다. 7 - 4 = 3 ✓' },
            { step: 3, description: '십의 자리끼리 뺍니다. 8 - 5 = 3 ✓' },
            { step: 4, description: '백의 자리끼리 뺍니다. 9 - 6 = 3 ✓' },
            { step: 5, description: '987 - 654 = 333이므로 계산이 맞습니다. ○' },
          ],
        },
        hints: { hints: ['직접 계산해서 결과를 비교해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '계산 검증'],
        estimatedTime: 30,
      },
    }),

    // ── 소단원 4: 받아내림이 있는 세 자리 수의 뺄셈 (문제 16~20) ──

    // 문제 16: 주관식
    prisma.problem.create({
      data: {
        topicId: topic4.id,
        objectiveId: objective4.id,
        content: '계산해 보세요.\n\n623 - 358',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 2,
        answer: { correct: '265' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 뺍니다. 3에서 8을 뺄 수 없으므로 십의 자리에서 1을 받아내림합니다. 13 - 8 = 5' },
            { step: 2, description: '십의 자리끼리 뺍니다. 1(받아내림)을 빼면 2 - 1 = 1, 1에서 5를 뺄 수 없으므로 백의 자리에서 받아내림합니다. 11 - 5 = 6' },
            { step: 3, description: '백의 자리끼리 뺍니다. 6 - 1(받아내림) - 3 = 2' },
            { step: 4, description: '따라서 623 - 358 = 265입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.', '뺄 수 없을 때는 윗자리에서 받아내림하세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '받아내림 있는 뺄셈'],
        estimatedTime: 60,
      },
    }),

    // 문제 17: 객관식
    prisma.problem.create({
      data: {
        topicId: topic4.id,
        objectiveId: objective4.id,
        content: '계산 결과로 알맞은 것을 고르세요.\n\n512 - 247',
        type: ProblemType.MULTIPLE_CHOICE,
        difficulty: 2,
        answer: { correct: 1, options: ['275', '265', '255', '335'] },
        solution: {
          steps: [
            { step: 1, description: '일의 자리끼리 뺍니다. 2에서 7을 뺄 수 없으므로 십의 자리에서 받아내림합니다. 12 - 7 = 5' },
            { step: 2, description: '십의 자리끼리 뺍니다. 1 - 1(받아내림) = 0에서 4를 뺄 수 없으므로 백의 자리에서 받아내림합니다. 10 - 4 = 6' },
            { step: 3, description: '백의 자리끼리 뺍니다. 5 - 1(받아내림) - 2 = 2' },
            { step: 4, description: '따라서 512 - 247 = 265입니다.' },
          ],
        },
        hints: { hints: ['일의 자리부터 차례로 계산해 보세요.', '받아내림이 있는지 확인해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '받아내림 있는 뺄셈'],
        estimatedTime: 60,
      },
    }),

    // 문제 18: 빈칸 채우기
    prisma.problem.create({
      data: {
        topicId: topic4.id,
        objectiveId: objective4.id,
        content: '□에 알맞은 수를 구하세요.\n\n7□2 - 385 = 347',
        type: ProblemType.FILL_IN_BLANK,
        difficulty: 3,
        answer: { correct: '3' },
        solution: {
          steps: [
            { step: 1, description: '일의 자리를 확인합니다. 2에서 5를 뺄 수 없으므로 받아내림합니다. 12 - 5 = 7 ✓' },
            { step: 2, description: '□에 수를 넣어 검산합니다. 732 - 385를 계산해 봅니다.' },
            { step: 3, description: '십의 자리: 3 - 1(받아내림) = 2에서 8을 뺄 수 없으므로 받아내림합니다. 12 - 8 = 4 ✓' },
            { step: 4, description: '백의 자리: 7 - 1(받아내림) - 3 = 3 ✓' },
            { step: 5, description: '따라서 □에 알맞은 수는 3입니다.' },
          ],
        },
        hints: { hints: ['결과에서 거꾸로 생각해 보세요.', '732 - 385를 직접 계산해서 확인해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '□에 알맞은 수', '받아내림 있는 뺄셈'],
        estimatedTime: 120,
      },
    }),

    // 문제 19: 문장제
    prisma.problem.create({
      data: {
        topicId: topic4.id,
        objectiveId: objective4.id,
        content: '학교에 학생이 531명 있습니다. 그중 여학생이 274명입니다. 남학생은 몇 명인지 구하세요.',
        type: ProblemType.SHORT_ANSWER,
        difficulty: 2,
        answer: { correct: '257' },
        solution: {
          steps: [
            { step: 1, description: '구하려는 것: 남학생의 수' },
            { step: 2, description: '주어진 조건: 전체 학생 531명, 여학생 274명' },
            { step: 3, description: '풀이: 531 - 274 = 257' },
            { step: 4, description: '따라서 남학생은 257명입니다.' },
          ],
        },
        hints: { hints: ['전체에서 여학생 수를 빼면 됩니다.', '531 - 274를 계산해 보세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '받아내림 있는 뺄셈', '문장제'],
        estimatedTime: 90,
      },
    }),

    // 문제 20: 참/거짓
    prisma.problem.create({
      data: {
        topicId: topic4.id,
        objectiveId: objective4.id,
        content: '다음 계산이 맞으면 ○, 틀리면 ×를 쓰세요.\n\n800 - 436 = 364',
        type: ProblemType.TRUE_FALSE,
        difficulty: 2,
        answer: { correct: true },
        solution: {
          steps: [
            { step: 1, description: '직접 계산하여 확인합니다.' },
            { step: 2, description: '일의 자리끼리 뺍니다. 0에서 6을 뺄 수 없으므로 받아내림합니다. 10 - 6 = 4' },
            { step: 3, description: '십의 자리끼리 뺍니다. 0 - 1(받아내림)에서 3을 뺄 수 없으므로 백의 자리에서 받아내림합니다. 9 - 3 = 6' },
            { step: 4, description: '백의 자리끼리 뺍니다. 8 - 1(받아내림) - 4 = 3' },
            { step: 5, description: '800 - 436 = 364이므로 계산이 맞습니다. ○' },
          ],
        },
        hints: { hints: ['직접 계산해서 결과를 비교해 보세요.', '받아내림을 빠뜨리지 않도록 주의하세요.'] },
        conceptTags: ['세 자리 수의 뺄셈', '계산 검증', '받아내림 있는 뺄셈'],
        estimatedTime: 45,
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
