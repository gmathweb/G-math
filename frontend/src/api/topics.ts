import { apiClient } from './client';
import type { PublicTopic, PublicTopicDetail } from '../types';

export function getTopics(locale: string): Promise<PublicTopic[]> {
  return apiClient<PublicTopic[]>(`/topics?locale=${locale}`);
}

export function getTopic(slug: string, locale: string): Promise<PublicTopicDetail> {
  return apiClient<PublicTopicDetail>(`/topics/${slug}?locale=${locale}`);
}
