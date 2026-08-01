import { useEffect, useState } from 'react';

/**
 * Reactively track a CSS media query (e.g. `(max-width: 1023px)`).
 * Used by the responsive app shell to switch between the desktop sidebar rail
 * and the mobile drawer without duplicating Tailwind breakpoint strings in JS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * True below Tailwind's `lg` breakpoint (1024px) — phones and portrait tablets.
 * Above that, the app keeps its persistent desktop sidebar rail.
 */
export const useIsMobile = () => useMediaQuery('(max-width: 1023px)');
