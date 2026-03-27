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
        {t('ko')}
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={locale === 'en' ? 'font-bold' : ''}
      >
        {t('en')}
      </button>
    </div>
  );
}
