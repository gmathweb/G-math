import { apiClient } from './client';
import type { PublicLessonDetail } from '../types';

export function getLesson(slug: string, locale: string): Promise<PublicLessonDetail> {
  return apiClient<PublicLessonDetail>(`/lessons/${slug}?locale=${locale}`);
}
