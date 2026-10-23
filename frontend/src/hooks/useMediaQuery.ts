import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query; used where the DOM differs per breakpoint (sidebar vs dialog). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    notify => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
