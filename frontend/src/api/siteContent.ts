import { apiClient } from './client';
import type { Locale, PublicSiteContent } from '../types';

export function getSiteContent(locale: Locale): Promise<PublicSiteContent> {
  return apiClient<PublicSiteContent>(`/site-content?locale=${locale}`);
}
