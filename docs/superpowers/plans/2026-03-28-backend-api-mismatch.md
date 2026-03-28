# 백엔드 API 불일치 보고서 (2026-03-28)

## 요약

프론트엔드(`memory-decay-dashboard`)가 호출하는 API 중 백엔드(`memory-decay-core`)에 존재하지 않거나 응답 구조가 다른 엔드포인트들이 있습니다.

---

## 1. `/admin/decay-params` — 존재하지 않음

프론트엔드 호출:
- `GET /admin/decay-params` (`lib/api.ts:167`)
- `PUT /admin/decay-params` (`lib/api.ts:171`)

백엔드reality: 해당 엔드포인트 **없음**. 백엔드에서 decay 파라미터를 API로 조회/수정하는 기능이 구현되어 있지 않음.

---

## 2. `/admin/tick-interval` — 존재하지 않음

프론트엔드 호출:
- `GET /admin/tick-interval` (`lib/api.ts:178`)
- `PUT /admin/tick-interval` (`lib/api.ts:182`)

백엔드 reality: 해당 엔드포인트 **없음**. Tick 간격은 CLI 인자 `--tick-interval` 또는 환경변수 `MD_TICK_INTERVAL`로만 설정 가능.

---

## 3. `/admin/history/summary` — 응답 구조 불일치

프론트엔드 기대 응답 (`lib/types.ts:103-108`):
```typescript
interface HistorySummary {
  total_memories: number
  current_tick: number
  categories: HistoryCategorySummary[]
  timeline: HistoryTimelinePoint[]  // ← 기대
}

interface HistoryTimelinePoint {
  tick: number
  avg_retrieval: number
  avg_storage: number
  avg_stability: number
  at_risk_count: number
}
```

백엔드 실제 응답 (`memory_store.py:get_memory_summary()`):
```python
{
    "total_memories": int,
    "avg_retrieval_score": float,
    "avg_storage_score": float,
    "at_risk_count": int,
    "categories": [...],
    "current_tick": int
}
# timeline 필드 없음 → 프론트엔드에서 undefined 에러
```

---

## 4. `timeline`이 의미하는 것 (time-series 데이터)

백엔드에는 이미 **개별 메모리의 이력**이 `activation_history` 테이블에 저장되어 있습니다:

```sql
CREATE TABLE activation_history (
    memory_id       TEXT NOT NULL,
    tick            INTEGER NOT NULL,
    retrieval_score REAL NOT NULL,
    storage_score   REAL NOT NULL,
    stability       REAL NOT NULL,
    recorded_at     REAL NOT NULL,
    PRIMARY KEY (memory_id, tick)
);
```

기록 시점: `_state.history_interval > 0`이고 `current_tick % history_interval == 0`일 때 `record_activation_history()` 호출.

**문제**: `get_memory_summary()`에서 이 원시 데이터를 **타임라인 집계(aggregate)**로 가공해서 반환하지 않음.

**`timeline`의 기대 의미**: 각 tick마다 전체 시스템의 평균 점수를 집계한 것.
```json
[
  {"tick": 0,   "avg_retrieval": 0.85, "avg_storage": 0.92, "avg_stability": 0.78, "at_risk_count": 0},
  {"tick": 10,  "avg_retrieval": 0.72, "avg_storage": 0.88, "avg_stability": 0.75, "at_risk_count": 1},
  {"tick": 20,  "avg_retrieval": 0.61, "avg_storage": 0.84, "avg_stability": 0.71, "at_risk_count": 3}
]
```

---

## 5. 현재 정상 동작하는 API들

- `GET /health`
- `GET /stats`
- `POST /store`
- `POST /search`
- `POST /tick`
- `POST /auto-tick`
- `DELETE /forget/:id`
- `POST /reset`
- `GET /admin/memories`, `GET /admin/memories/:id`
- `GET /admin/memories/:id/history` (개별 메모리 이력 — ActivationRecord)

---

## 6. 필요한 백엔드 수정사항

| 우선순위 | 항목 | 설명 |
|---|---|---|
| 높음 | `GET /admin/decay-params` | 현재 디폴트값 반환即可 |
| 높음 | `PUT /admin/decay-params` | 파라미터 업데이트 |
| 중간 | `GET /admin/tick-interval` | 현재 값 반환 |
| 중간 | `PUT /admin/tick-interval` | 값 업데이트 |
| 높음 | `GET /admin/history/summary`에 `timeline` 추가 | activation_history 테이블 집계하여 timeline 배열 반환 |

---

## 7. 프론트엔드 임시 수정 (이미 적용됨)

백엔드 수정 전까지 프론트엔드 크래시를 방지하기 위해 다음 수정 적용:
- `analytics/page.tsx:69` — `history.timeline && history.timeline.length > 0` 가드 추가
- `analytics/page.tsx:107` — `history.categories && history.categories.length > 0` 가드 추가
- `param-editor.tsx:18` — `getDecayParams()` 에 `.catch()` 추가 (loading 무한 대기 방지)
