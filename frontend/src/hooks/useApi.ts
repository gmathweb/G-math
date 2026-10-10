import { useCallback, useEffect, useState } from 'react';

interface Settled<T> { key: string; data?: T; error?: unknown }

export function useApi<T>(key: string | null, load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const requestKey = key === null ? null : `${key}#${attempt}`;

  useEffect(() => {
    if (requestKey === null) return;
    let cancelled = false;
    load().then(
      data => { if (!cancelled) setSettled({ key: requestKey, data }); },
      error => { if (!cancelled) setSettled({ key: requestKey, error }); },
    );
    return () => { cancelled = true; };
    // `load` is recreated each render; the request identity is `requestKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const current = settled && settled.key === requestKey ? settled : null;
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return {
    data: current?.data,
    error: current?.error,
    loading: requestKey !== null && current === null,
    retry,
  };
}
