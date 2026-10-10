import { apiClient } from './client';
import type { Locale, PublicHeroSlide } from '../types';

export function getHeroSlides(locale: Locale): Promise<PublicHeroSlide[]> {
  return apiClient<PublicHeroSlide[]>(`/hero-slides?locale=${locale}`);
}
