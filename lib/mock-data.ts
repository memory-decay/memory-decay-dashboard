import { Memory, SystemStats } from "./types"

export const MOCK_STATS: SystemStats = {
  num_memories: 47,
  current_tick: 128,
  last_tick_time: "2026-03-27T09:30:00Z",
}

export const MOCK_MEMORIES: Memory[] = [
  {
    id: "mem_001",
    text: "사용자는 TypeScript를 선호하며 프로젝트에서 항상 strict 모드를 사용합니다.",
    importance: 0.9,
    mtype: "preference",
    category: "개발환경",
    created_tick: 5,
    retrieval_score: 0.85,
    storage_score: 0.92,
    stability: 0.88,
    freshness: 0.95,
    associations: ["mem_003", "mem_010"],
    speaker: "user",
  },
  {
    id: "mem_002",
    text: "3월 15일에 인증 서비스의 토큰 갱신 로직에서 경쟁 조건(race condition) 버그를 발견했습니다.",
    importance: 0.95,
    mtype: "episode",
    category: "버그",
    created_tick: 45,
    retrieval_score: 0.78,
    storage_score: 0.85,
    stability: 0.72,
    freshness: 0.68,
    associations: ["mem_005"],
    speaker: "assistant",
  },
  {
    id: "mem_003",
    text: "Next.js App Router를 사용하여 프론트엔드를 구축하기로 결정했습니다.",
    importance: 0.8,
    mtype: "decision",
    category: "아키텍처",
    created_tick: 10,
    retrieval_score: 0.72,
    storage_score: 0.88,
    stability: 0.9,
    freshness: 0.82,
    associations: ["mem_001"],
    speaker: "user",
  },
  {
    id: "mem_004",
    text: "API 응답 시간이 200ms를 초과하면 캐시 레이어를 도입해야 합니다.",
    importance: 0.7,
    mtype: "fact",
    category: "성능",
    created_tick: 30,
    retrieval_score: 0.55,
    storage_score: 0.65,
    stability: 0.6,
    freshness: 0.45,
    associations: [],
  },
  {
    id: "mem_005",
    text: "인증 서비스는 토큰 인트로스펙션을 지원하지 않으므로 4xx 응답을 모두 잡아서 처리해야 합니다.",
    importance: 0.85,
    mtype: "fact",
    category: "인증",
    created_tick: 46,
    retrieval_score: 0.82,
    storage_score: 0.79,
    stability: 0.75,
    freshness: 0.7,
    associations: ["mem_002"],
  },
  {
    id: "mem_006",
    text: "프로젝트에서 Tailwind CSS v3를 사용하고 있으며, 커스텀 다크 테마가 적용되어 있습니다.",
    importance: 0.6,
    mtype: "fact",
    category: "개발환경",
    created_tick: 8,
    retrieval_score: 0.42,
    storage_score: 0.55,
    stability: 0.65,
    freshness: 0.35,
    associations: ["mem_001"],
  },
  {
    id: "mem_007",
    text: "코드 리뷰에서 불필요한 추상화를 피하고 YAGNI 원칙을 따르기로 합의했습니다.",
    importance: 0.75,
    mtype: "decision",
    category: "코드품질",
    created_tick: 20,
    retrieval_score: 0.68,
    storage_score: 0.72,
    stability: 0.8,
    freshness: 0.6,
    associations: ["mem_009"],
  },
  {
    id: "mem_008",
    text: "데이터베이스 마이그레이션은 항상 롤백 스크립트를 함께 작성해야 합니다.",
    importance: 0.88,
    mtype: "preference",
    category: "데이터베이스",
    created_tick: 15,
    retrieval_score: 0.35,
    storage_score: 0.48,
    stability: 0.55,
    freshness: 0.28,
    associations: [],
  },
  {
    id: "mem_009",
    text: "테스트 커버리지가 80% 이하로 떨어지면 CI에서 빌드가 실패하도록 설정되어 있습니다.",
    importance: 0.65,
    mtype: "fact",
    category: "CI/CD",
    created_tick: 25,
    retrieval_score: 0.28,
    storage_score: 0.38,
    stability: 0.5,
    freshness: 0.2,
    associations: ["mem_007"],
  },
  {
    id: "mem_010",
    text: "ESLint와 Prettier를 통합하여 코드 포맷팅을 자동화했습니다.",
    importance: 0.5,
    mtype: "episode",
    category: "개발환경",
    created_tick: 12,
    retrieval_score: 0.22,
    storage_score: 0.3,
    stability: 0.45,
    freshness: 0.15,
    associations: ["mem_001", "mem_006"],
  },
  {
    id: "mem_011",
    text: "사용자가 매주 월요일에 배포 일정을 확인합니다.",
    importance: 0.4,
    mtype: "episode",
    category: "워크플로우",
    created_tick: 60,
    retrieval_score: 0.18,
    storage_score: 0.25,
    stability: 0.35,
    freshness: 0.12,
    associations: [],
  },
  {
    id: "mem_012",
    text: "Redis 캐시 TTL은 기본 300초로 설정되어 있습니다.",
    importance: 0.55,
    mtype: "fact",
    category: "인프라",
    created_tick: 35,
    retrieval_score: 0.15,
    storage_score: 0.2,
    stability: 0.3,
    freshness: 0.08,
    associations: ["mem_004"],
  },
]

/** Category counts derived from mock data */
export function getMockCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of MOCK_MEMORIES) {
    counts[m.category] = (counts[m.category] || 0) + 1
  }
  return counts
}

/** Type counts */
export function getMockTypeCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of MOCK_MEMORIES) {
    counts[m.mtype] = (counts[m.mtype] || 0) + 1
  }
  return counts
}
