# English Language Support Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English language support to the Korean-only dashboard by implementing i18n with next-intl.

**Architecture:** Install next-intl, extract all hardcoded Korean strings into locale JSON files, replace inline strings with translation function calls, and add a language switcher component.

**Tech Stack:** next-intl (v3.x), Next.js 15 App Router, React 19

---

## Chunk 1: Project Setup & Dependencies

### Files

- `package.json` — Add next-intl dependency

### Tasks

- [ ] **Step 1: Install next-intl**

Run:
```bash
cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npm install next-intl
```
Expected: Package installed without errors

- [ ] **Step 2: Configure next-intl in next.config.ts**

Modify: `next.config.ts`

Add the experimental `i18n` plugin:

```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Create i18n configuration**

Create: `lib/i18n.ts`

```typescript
import { getRequestConfig } from 'next-intl/server';

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Create messages directory and Korean locale file**

Create: `messages/ko.json`

Extract all Korean strings from the codebase into this file. Structure:

```json
{
  "common": {
    "dashboard": "대시보드",
    "search": "검색",
    "analytics": "분석",
    "settings": "설정"
  },
  "memory": {
    "title": "메모리",
    "freshness": {
      "fresh": "신선함",
      "stale": "陈旧",
      "expired": "만료"
    }
  }
}
```

- [ ] **Step 5: Create English locale file**

Create: `messages/en.json`

```json
{
  "common": {
    "dashboard": "Dashboard",
    "search": "Search",
    "analytics": "Analytics",
    "settings": "Settings"
  },
  "memory": {
    "title": "Memory",
    "freshness": {
      "fresh": "Fresh",
      "stale": "Stale",
      "expired": "Expired"
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts lib/i18n.ts messages/
git commit -m "feat: add next-intl i18n framework setup"
```

---

## Chunk 2: Middleware & App Configuration

### Files

- `middleware.ts` — Handle locale routing
- `app/layout.tsx` — Wrap app with NextIntlClientProvider
- `app/[locale]/layout.tsx` — Dynamic locale layout (create new)

### Tasks

- [ ] **Step 1: Create middleware for locale routing**

Create: `middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  matcher: ['/', '/(ko|en)/:path*'],
};
```

- [ ] **Step 2: Restructure app directory for locale support**

Move `app` contents into `app/[locale]` structure:

```
app/
  [locale]/
    layout.tsx   # NEW - locale-aware layout
    page.tsx      # Move from root page.tsx
    admin/
      page.tsx    # Move
    search/
      page.tsx    # Move
    ...
```

Create: `app/[locale]/layout.tsx`

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!['ko', 'en'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update root layout to redirect**

Modify: `app/layout.tsx` (root)

```typescript
import { redirect } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect('/ko');
}
```

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/
git commit -m "feat: add locale middleware and app restructuring"
```

---

## Chunk 3: Extract Korean Strings to Translation Files

### Files

- `lib/types.ts` — Remove hardcoded Korean, reference translations
- `components/sidebar.tsx` — Use `useTranslations`
- `components/memory-table.tsx` — Use `useTranslations`
- `components/stats-cards.tsx` — Use `useTranslations`
- `components/param-editor.tsx` — Use `useTranslations`

### Tasks

- [ ] **Step 1: Populate ko.json with all Korean strings from types.ts**

Strings to extract from `lib/types.ts`:
- `MEMORY_TYPE_LABELS` (lines 66-70)
- `DECAY_STAGE_LABELS` (lines 107-112)
- `FRESHNESS_LABELS` (lines 173-177)
- `DECAY_PARAM_LABELS` (lines 179-182)
- All status labels

Add to `messages/ko.json`:

```json
{
  "types": {
    "memoryType": {
      "semantic": "시맨틱",
      "episodic": "에피소딕",
      "procedural": "프로시저럴"
    },
    "decayStage": {
      "stable": "안정",
      "decaying": "감소",
      "critical": "위험"
    },
    "freshness": {
      "fresh": "신선함",
      "stale": "陈旧",
      "expired": "만료"
    },
    "decayParam": {
      "decayRate": "감쇠율",
      "threshold": "임계값",
      "halfLife": "반감기"
    }
  }
}
```

- [ ] **Step 2: Update lib/types.ts to use translation keys**

Modify constants to return translation keys instead of Korean strings:

```typescript
export const MEMORY_TYPE_LABELS = {
  semantic: 'types.memoryType.semantic',
  episodic: 'types.memoryType.episodic',
  procedural: 'types.memoryType.procedural',
} as const;

export const FRESHNESS_LABELS = {
  fresh: 'types.freshness.fresh',
  stale: 'types.freshness.stale',
  expired: 'types.freshness.expired',
} as const;
```

- [ ] **Step 3: Add component translation keys to ko.json**

Add section for component strings:

```json
{
  "sidebar": {
    "dashboard": "대시보드",
    "search": "검색",
    "analytics": "분석",
    "settings": "설정"
  },
  "table": {
    "sortByFreshness": "신선도순",
    "sortByType": "유형순",
    "sortByLastAccess": "최근 접근순",
    "column": {
      "name": "이름",
      "type": "유형",
      "freshness": "신선도",
      "lastAccess": "최근 접근"
    }
  },
  "stats": {
    "totalMemories": "전체 메모리",
    "avgFreshness": "평균 신선도",
    "decaying": "감소 중"
  },
  "paramEditor": {
    "save": "저장",
    "reset": "초기화",
    "decayRate": "감쇠율",
    "threshold": "임계값"
  }
}
```

- [ ] **Step 4: Update sidebar.tsx to use translations**

Modify: `components/sidebar.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function Sidebar() {
  const t = useTranslations('sidebar');

  return (
    <nav>
      <a href="/">{t('dashboard')}</a>
      <a href="/search">{t('search')}</a>
      <a href="/analytics">{t('analytics')}</a>
      <a href="/settings">{t('settings')}</a>
    </nav>
  );
}
```

- [ ] **Step 5: Update other components similarly**

Update `memory-table.tsx`, `stats-cards.tsx`, `param-editor.tsx` to use `useTranslations`.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts components/*.tsx messages/ko.json
git commit -m "feat: extract Korean strings to translation files"
```

---

## Chunk 4: Create English Translations

### Files

- `messages/en.json` — Fill with English translations

### Tasks

- [ ] **Step 1: Add complete English translations**

Create: `messages/en.json`

```json
{
  "types": {
    "memoryType": {
      "semantic": "Semantic",
      "episodic": "Episodic",
      "procedural": "Procedural"
    },
    "decayStage": {
      "stable": "Stable",
      "decaying": "Decaying",
      "critical": "Critical"
    },
    "freshness": {
      "fresh": "Fresh",
      "stale": "Stale",
      "expired": "Expired"
    },
    "decayParam": {
      "decayRate": "Decay Rate",
      "threshold": "Threshold",
      "halfLife": "Half-Life"
    }
  },
  "sidebar": {
    "dashboard": "Dashboard",
    "search": "Search",
    "analytics": "Analytics",
    "settings": "Settings"
  },
  "table": {
    "sortByFreshness": "Sort by Freshness",
    "sortByType": "Sort by Type",
    "sortByLastAccess": "Sort by Last Access",
    "column": {
      "name": "Name",
      "type": "Type",
      "freshness": "Freshness",
      "lastAccess": "Last Access"
    }
  },
  "stats": {
    "totalMemories": "Total Memories",
    "avgFreshness": "Average Freshness",
    "decaying": "Decaying"
  },
  "paramEditor": {
    "save": "Save",
    "reset": "Reset",
    "decayRate": "Decay Rate",
    "threshold": "Threshold"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add messages/en.json
git commit -m "feat: add English translations"
```

---

## Chunk 5: Language Switcher Component

### Files

- `components/language-switcher.tsx` — NEW language switcher
- `components/sidebar.tsx` — Integrate switcher

### Tasks

- [ ] **Step 1: Create language switcher component**

Create: `components/language-switcher.tsx`

```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('languageSwitcher');
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment
    router.push(segments.join('/'));
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLocale('ko')}
        className={locale === 'ko' ? 'font-bold' : ''}
      >
        한국어
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={locale === 'en' ? 'font-bold' : ''}
      >
        English
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add language switcher to sidebar**

Modify: `components/sidebar.tsx`

Add `<LanguageSwitcher />` to the sidebar markup.

- [ ] **Step 3: Add languageSwitcher messages to locale files**

Add to both `messages/ko.json` and `messages/en.json`:

```json
{
  "languageSwitcher": {
    "ko": "한국어",
    "en": "English"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add components/language-switcher.tsx components/sidebar.tsx messages/
git commit -m "feat: add language switcher component"
```

---

## Chunk 6: Verify Build & Test

### Tasks

- [ ] **Step 1: Run build to verify no errors**

Run:
```bash
npm run build
```
Expected: Build completes without errors

- [ ] **Step 2: Test language switching in browser** (manual)

1. Start dev server: `npm run dev`
2. Visit `/ko` — Korean UI
3. Click "English" button — URL changes to `/en`, UI shows English
4. Verify all strings are translated

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete English language support

- Add next-intl i18n framework
- Extract all hardcoded Korean strings to translation files
- Add English translations
- Add language switcher component
- Restructure app for locale routing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## File Summary

| Action | File |
|--------|------|
| Create | `lib/i18n.ts` |
| Create | `middleware.ts` |
| Create | `messages/ko.json` |
| Create | `messages/en.json` |
| Create | `components/language-switcher.tsx` |
| Create | `app/[locale]/layout.tsx` |
| Modify | `next.config.ts` |
| Modify | `app/layout.tsx` |
| Modify | `lib/types.ts` |
| Modify | `components/sidebar.tsx` |
| Modify | `components/memory-table.tsx` |
| Modify | `components/stats-cards.tsx` |
| Modify | `components/param-editor.tsx` |
| Move | `app/page.tsx` → `app/[locale]/page.tsx` |
| Move | `app/admin/page.tsx` → `app/[locale]/admin/page.tsx` |
| Move | `app/search/page.tsx` → `app/[locale]/search/page.tsx` |
