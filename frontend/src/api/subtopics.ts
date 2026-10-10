import { apiClient } from './client';
import type { Subtopic } from '../types';

export function getSubtopics(
  topicSlug: string,
  subtopicSlug: string,
  locale: string,
): Promise<Subtopic> {
  return apiClient<Subtopic>(
    `/topics/${topicSlug}/subtopics/${subtopicSlug}?locale=${locale}`,
  );
}
