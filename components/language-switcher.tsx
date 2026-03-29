'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const locales = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-border">
      {locales.map((loc) => {
        const isActive = locale === loc.code;
        return (
          <button
            key={loc.code}
            onClick={() => switchLocale(loc.code)}
            className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-text-primary text-bg-surface font-semibold shadow-sm border border-border'
                : 'text-text-primary font-medium hover:text-text-primary hover:bg-surface-3 border border-transparent'
            }`}
          >
            <span className="uppercase">{loc.code}</span>
            <span>{loc.label}</span>
          </button>
        );
      })}
    </div>
  );
}
