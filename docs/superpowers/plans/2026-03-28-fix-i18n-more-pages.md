# Fix i18n for Graph, Memory Detail, and Admin Pages

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded Korean strings with i18n translations on `/en/graph`, `/en/memory/[id]`, and `/en/admin` pages.

---

## Chunk 1: Add Translation Keys to JSON Files

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ko.json`

### Task 1: Add graph, memory, admin namespaces to en.json

- [ ] **Step 1: Add namespaces to en.json**

Add after `"search": { ... }` section (before closing `}`):

```json
,
"graph": {
  "title": "Association Graph",
  "subtitle": "Visualization of memory associations",
  "loading": "Loading graph..."
},
"memory": {
  "title": "Memory Detail",
  "breadcrumb": {
    "dashboard": "Dashboard",
    "detail": "Memory Detail"
  },
  "content": "Content",
  "category": "Category",
  "type": "Type",
  "importance": "Importance",
  "createdTick": "Created Tick",
  "currentScores": "Current Scores",
  "retrievalScore": "Retrieval Score",
  "storageScore": "Storage Score",
  "stability": "Stability",
  "freshness": "Freshness",
  "estimatedLife": "Estimated Lifespan",
  "estimatedLifeNote": "(until retrieval < 0.01)",
  "infinity": "∞",
  "ticks": "ticks",
  "activationHistory": "Activation History",
  "scoreChangeOverTime": "Score change over time",
  "reinforcementDetected": "Reinforcement events detected",
  "associatedMemories": "Associated Memories",
  "speaker": "Speaker",
  "reinforce": "Reinforce",
  "delete": "Delete",
  "loading": "Loading...",
  "notFound": "Memory not found.",
  "confirmDelete": "Are you sure you want to delete this memory?",
  "connectionError": "Cannot connect to server."
},
"admin": {
  "title": "Admin",
  "subtitle": "System Control & Memory Management",
  "globalControl": "Global Control",
  "forceTick": "Force Tick Progression",
  "tickProgress": "Progress {count} ticks",
  "tickComplete": "{count} ticks progressed. Current tick: {current}",
  "memoryInit": "Memory Initialization",
  "memoryInitWarning": "Deletes all memories. This action cannot be undone.",
  "resetAll": "Reset All",
  "confirmReset": "Are you sure you want to reset all memories? This cannot be undone.",
  "initComplete": "Reset complete. {count} memories deleted.",
  "addNew": "Add New Memory",
  "text": "Text",
  "textPlaceholder": "Enter memory content...",
  "type": "Type",
  "category": "Category",
  "categoryPlaceholder": "e.g. Architecture",
  "importance": "Importance",
  "saveMemory": "Save Memory",
  "tickInterval": "Tick Interval",
  "seconds": "seconds",
  "save": "Save",
  "intervalSaved": "Tick interval changed to {interval} seconds.",
  "intervalFailed": "Failed to change tick interval.",
  "decayParams": "Decay Parameters",
  "connectionError": "Cannot connect to server.",
  "enterTextAndCategory": "Enter text and category."
}
```

### Task 2: Add namespaces to ko.json

- [ ] **Step 1: Add namespaces to ko.json**

```json
,
"graph": {
  "title": "연관 그래프",
  "subtitle": "메모리 간 연관 관계 시각화",
  "loading": "그래프 불러오는 중..."
},
"memory": {
  "title": "메모리 상세",
  "breadcrumb": {
    "dashboard": "대시보드",
    "detail": "메모리 상세"
  },
  "content": "내용",
  "category": "카테고리",
  "type": "유형",
  "importance": "중요도",
  "createdTick": "생성 틱",
  "currentScores": "현재 점수",
  "retrievalScore": "검색 점수",
  "storageScore": "저장 점수",
  "stability": "안정성",
  "freshness": "신선도",
  "estimatedLife": "예상 수명",
  "estimatedLifeNote": "(활성도 < 0.01까지)",
  "infinity": "∞",
  "ticks": "틱",
  "activationHistory": "활성화 히스토리",
  "scoreChangeOverTime": "시간에 따른 점수 변화",
  "reinforcementDetected": "강화 이벤트 {count}회 감지",
  "associatedMemories": "연관 메모리",
  "speaker": "화자",
  "reinforce": "강화",
  "delete": "삭제",
  "loading": "불러오는 중...",
  "notFound": "메모리를 찾을 수 없습니다.",
  "confirmDelete": "이 메모리를 삭제하시겠습니까?",
  "connectionError": "서버에 연결할 수 없습니다."
},
"admin": {
  "title": "관리",
  "subtitle": "시스템 제어 및 메모리 관리",
  "globalControl": "전역 제어",
  "forceTick": "강제 틱 진행",
  "tickProgress": "{count}틱 진행",
  "tickComplete": "{count}틱 진행 완료. 현재 틱: {current}",
  "memoryInit": "메모리 초기화",
  "memoryInitWarning": "모든 메모리를 삭제합니다. 이 작업은 되돌릴 수 없습니다.",
  "resetAll": "전체 초기화",
  "confirmReset": "모든 메모리를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
  "initComplete": "초기화 완료. {count}개 메모리 삭제됨.",
  "addNew": "새 메모리 추가",
  "text": "텍스트",
  "textPlaceholder": "메모리 내용을 입력하세요...",
  "type": "유형",
  "category": "카테고리",
  "categoryPlaceholder": "예: 아키텍처",
  "importance": "중요도",
  "saveMemory": "메모리 저장",
  "tickInterval": "틱 간격",
  "seconds": "초",
  "save": "저장",
  "intervalSaved": "틱 간격이 {interval}초로 변경되었습니다.",
  "intervalFailed": "틱 간격 변경에 실패했습니다.",
  "decayParams": "감쇠 파라미터",
  "connectionError": "서버에 연결할 수 없습니다.",
  "enterTextAndCategory": "텍스트와 카테고리를 입력하세요."
}
```

---

## Chunk 2: Update Components

**Files:**
- Modify: `app/[locale]/graph/page.tsx`
- Modify: `app/[locale]/memory/[id]/page.tsx`
- Modify: `app/[locale]/admin/page.tsx`

### Task 3: Update graph/page.tsx

- [ ] **Step 1: Add imports**

```typescript
import { useTranslations } from 'next-intl'
```

- [ ] **Step 2: Add hook in component**

```typescript
const t = useTranslations()
```

- [ ] **Step 3: Replace hardcoded strings**

- `"그래프 불러오는 중..."` → `t('graph.loading')`
- `"연관 그래프"` → `t('graph.title')`
- `"메모리 간 연관 관계 시각화"` → `t('graph.subtitle')`
- `"불러오는 중..."` → `t('graph.loading')`

### Task 4: Update memory/[id]/page.tsx

- [ ] **Step 1: Add imports**

```typescript
import { useTranslations } from 'next-intl'
```

- [ ] **Step 2: Add hook in component**

```typescript
const t = useTranslations('memory')
```

- [ ] **Step 3: Replace all hardcoded Korean strings**

See detailed mapping in analysis above.

### Task 5: Update admin/page.tsx

- [ ] **Step 1: Add imports**

```typescript
import { useTranslations } from 'next-intl'
```

- [ ] **Step 2: Add hook in component**

```typescript
const t = useTranslations('admin')
```

- [ ] **Step 3: Replace all hardcoded Korean strings**

Note: MTYPE_OPTIONS labels need to come from `useTranslations('types.memoryType')`.

---

## Verification

- [ ] Run `npx tsc --noEmit` - no errors
- [ ] Run `npm run build` - successful build
