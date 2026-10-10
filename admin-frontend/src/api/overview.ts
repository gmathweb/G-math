import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { useTopics } from './topics';
import { useHeroSlides } from './hero';
import { useFiles } from './files';
import { useLessons } from './lessons';

export interface OverviewStats {
  topics: number;
  subtopics: number;
  lessons: number;
  hero_slides: number;
  files: number;
}

/**
 * Try the dedicated stats endpoint first; if it doesn't exist yet,
 * aggregate counts from the individual list hooks.
 */
export function useOverviewStats() {
  const direct = useQuery<OverviewStats>({
    queryKey: ['overview-stats'],
    queryFn: () => api.get<OverviewStats>('/admin/stats'),
    retry: false,
  });

  const topicsQ = useTopics();
  const heroQ = useHeroSlides();
  const filesQ = useFiles();
  const lessonsQ = useLessons();

  if (direct.isSuccess) return direct;

  const isLoading =
    topicsQ.isLoading || heroQ.isLoading || filesQ.isLoading || lessonsQ.isLoading;

  const subtopicCount =
    topicsQ.data?.reduce((sum, t) => sum + (t.subtopic_count ?? 0), 0) ?? 0;

  const data: OverviewStats | undefined =
    topicsQ.data && heroQ.data && filesQ.data && lessonsQ.data
      ? {
          topics: topicsQ.data.length,
          subtopics: subtopicCount,
          lessons: lessonsQ.data.length,
          hero_slides: heroQ.data.length,
          files: filesQ.data.length,
        }
      : undefined;

  return {
    ...direct,
    data,
    isLoading,
    isSuccess: !!data,
    isError: false,
  };
}
