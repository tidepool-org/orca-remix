import { createContext, ReactNode, useContext } from 'react';
import { type Locale } from 'react-aria';

const LocaleContext = createContext<Locale>({
  locale: 'en-US',
  direction: 'ltr',
});

export function LocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export default function useLocale() {
  return useContext(LocaleContext);
}
