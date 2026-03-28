# Fix i18n Hardcoded Korean Strings - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 3 hardcoded Korean strings with proper i18n translation keys so they display correctly in English locale.

**Architecture:** Add missing translation keys to both `messages/en.json` and `messages/ko.json` under a new `search` namespace, then update `components/association-graph.tsx`, `components/quick-search.tsx`, and `app/[locale]/search/page.tsx` to use `useTranslations()`.

**Tech Stack:** next-intl (useTranslations, useLocale hooks)

---

## Chunk 1: Add Translation Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ko.json`

### Task 1: Add search namespace to en.json

- [ ] **Step 1: Add `search` namespace with `memorySearch` key to en.json**

Edit `messages/en.json` - add after line 109 (before the closing `}`):

```json
,
"search": {
  "title": "Memory Search",
  "placeholder": "Search memories..."
}
```

### Task 2: Add search namespace to ko.json

- [ ] **Step 1: Add `search` namespace with `memorySearch` key to ko.json**

Edit `messages/ko.json` - add after line 109 (before the closing `}`):

```json
,
"search": {
  "title": "메모리 검색",
  "placeholder": "메모리 검색..."
}
```

---

## Chunk 2: Update Components to Use Translations

**Files:**
- Modify: `components/association-graph.tsx`
- Modify: `components/quick-search.tsx`
- Modify: `app/[locale]/search/page.tsx`

### Task 3: Update association-graph.tsx

- [ ] **Step 1: Read the file to see current import and usage**

Run: `head -30 components/association-graph.tsx`

- [ ] **Step 2: Add useTranslations import if not present**

Check if `useTranslations` is already imported. If not, add:
```typescript
import { useTranslations } from 'next-intl';
```

- [ ] **Step 3: Add search hook inside the component**

Find where other hooks like `useLocale` are used and add nearby:
```typescript
const t = useTranslations('search');
```

- [ ] **Step 4: Replace hardcoded Korean placeholder**

Change line 223:
```typescript
// FROM:
placeholder="메모리 검색..."
// TO:
placeholder={t('placeholder')}
```

### Task 4: Update quick-search.tsx

- [ ] **Step 1: Read the file to see current import and usage**

Run: `head -30 components/quick-search.tsx`

- [ ] **Step 2: Add useTranslations import if not present**

```typescript
import { useTranslations } from 'next-intl';
```

- [ ] **Step 3: Add search hook inside the component**

```typescript
const t = useTranslations('search');
```

- [ ] **Step 4: Replace hardcoded Korean placeholder**

Change line 23:
```typescript
// FROM:
placeholder="메모리 검색..."
// TO:
placeholder={t('placeholder')}
```

### Task 5: Update search page.tsx

- [ ] **Step 1: Read the file to see current import and usage**

Run: `head -60 app/[locale]/search/page.tsx`

- [ ] **Step 2: Add useTranslations import if not present**

```typescript
import { useTranslations } from 'next-intl';
```

- [ ] **Step 3: Add search hook inside the SearchPage component**

```typescript
const t = useTranslations('search');
```

- [ ] **Step 4: Replace hardcoded Korean h1 text**

Change line 43:
```typescript
// FROM:
<h1 className="...">메모리 검색</h1>
// TO:
<h1 className="...">{t('title')}</h1>
```

---

## Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors related to our changes

- [ ] **Step 2: Build the app**

Run: `npm run build 2>&1 | head -50`
Expected: Successful build with no i18n-related errors

- [ ] **Step 3: Start dev server and verify**

Run: `npm run dev &` then check http://localhost:3000/en/search
Expected: "Memory Search" heading in English, search placeholder says "Search memories..."

---

## Summary of Changes

| File | Change |
|------|--------|
| `messages/en.json` | Added `search` namespace with `title` and `placeholder` keys |
| `messages/ko.json` | Added `search` namespace with Korean translations |
| `components/association-graph.tsx` | Replaced hardcoded placeholder with `t('placeholder')` |
| `components/quick-search.tsx` | Replaced hardcoded placeholder with `t('placeholder')` |
| `app/[locale]/search/page.tsx` | Replaced hardcoded h1 with `t('title')` |
