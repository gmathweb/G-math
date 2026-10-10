import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import type { Lesson } from '../types';

interface LessonRecord {
  id: string;
  subtopic_id: string;
  topic_id?: string;
  name_he: string;
  name_en: string;
  name_ar: string;
  subtopic_name?: string;
  topic_name?: string;
  is_published: boolean;
  content_files: { id: string }[];
}

export interface LessonInput {
  subtopic_id: string;
  name_he: string;
  name_en: string;
  name_ar?: string;
}

export function useLessons(topicId?: string, subtopicId?: string) {
  const params = new URLSearchParams();
  if (topicId) params.append('topic_id', topicId);
  if (subtopicId) params.append('subtopic_id', subtopicId);
  const qs = params.toString();
  return useQuery<Lesson[]>({
    queryKey: ['lessons', topicId ?? 'all', subtopicId ?? 'all'],
    queryFn: async () => {
      const records = await api.get<LessonRecord[]>(`/admin/lessons${qs ? `?${qs}` : ''}`);
      return records.map(record => ({
        id: record.id,
        name: { he: record.name_he, en: record.name_en, ar: record.name_ar },
        subtopic_id: record.subtopic_id,
        topic_id: record.topic_id ?? '',
        subtopic_name: record.subtopic_name ?? '',
        topic_name: record.topic_name ?? '',
        file_count: record.content_files.length,
        status: record.is_published ? 'published' as const : 'draft' as const,
      }));
    },
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LessonInput) =>
      api.post<LessonRecord>('/admin/lessons', { ...data, name_ar: data.name_ar ?? '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] });
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      toast.success('השיעור נוצר בהצלחה');
    },
    onError: () => toast.error('שגיאה ביצירת השיעור'),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<LessonInput> & { id: string }) =>
      api.put<LessonRecord>(`/admin/lessons/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] });
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      toast.success('השיעור עודכן בהצלחה');
    },
    onError: () => toast.error('שגיאה בעדכון השיעור'),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/lessons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] });
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      toast.success('השיעור נמחק בהצלחה');
    },
    onError: () => toast.error('שגיאה במחיקת השיעור'),
  });
}
