import { useEffect } from 'react';
import { useLocale } from './useLocale';
import { applyDirection, getDirection } from '../utils/direction';

export function useDirection() {
  const { locale } = useLocale();
  const direction = getDirection(locale);

  useEffect(() => {
    applyDirection(locale);
  }, [locale]);

  return direction;
}
