import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import type { Topic, Subtopic, LocalizedText } from '../types';

interface TopicRecord {
  id: string;
  icon: string;
  color: string;
  bg_color: string;
  name_he: string;
  name_en: string;
  name_ar: string;
  description_he?: string;
  description_en?: string;
  description_ar?: string;
  subtopic_count: number;
  lesson_count: number;
  sort_order: number;
  is_published: boolean;
}

interface SubtopicRecord {
  id: string;
  icon?: string;
  name_he: string;
  name_en: string;
  name_ar: string;
  topic_id: string;
  topic_name?: string;
  lesson_count: number;
  sort_order: number;
  is_published: boolean;
}

// The backend requires non-empty EN/AR names; fall back to Hebrew when left blank.
function namePayload(name?: LocalizedText) {
  if (!name) return {};
  const he = name.he.trim();
  return { name_he: he, name_en: name.en.trim() || he, name_ar: name.ar.trim() || he };
}

function bySortOrder<T extends { sort_order: number }>(a: T, b: T) {
  return a.sort_order - b.sort_order;
}

function topicPayload(data: Partial<Topic>) {
  return {
    icon: data.icon, color: data.color, bg_color: data.bg_color,
    ...namePayload(data.name),
    description_he: data.description?.he,
    description_en: data.description?.en,
    description_ar: data.description?.ar,
    sort_order: data.sort_order,
    is_published: data.status === undefined ? undefined : data.status === 'published',
  };
}

function subtopicPayload(data: Partial<Subtopic>) {
  return {
    topic_id: data.topic_id,
    icon: data.icon,
    ...namePayload(data.name),
    sort_order: data.sort_order,
    is_published: data.status === undefined ? undefined : data.status === 'published',
  };
}

// ── Topics ──────────────────────────────────────────────────────────

export function useTopics() {
  return useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => (await api.get<TopicRecord[]>('/admin/topics')).sort(bySortOrder).map(record => ({
      id: record.id, icon: record.icon, color: record.color, bg_color: record.bg_color,
      name: { he: record.name_he, en: record.name_en, ar: record.name_ar },
      description: { he: record.description_he ?? '', en: record.description_en ?? '', ar: record.description_ar ?? '' },
      subtopic_count: record.subtopic_count, lesson_count: record.lesson_count,
      sort_order: record.sort_order,
      status: record.is_published ? 'published' as const : 'draft' as const,
    })),
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Topic>) => api.post<TopicRecord>('/admin/topics', topicPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
      toast.success('הנושא נוצר בהצלחה');
    },
    onError: () => toast.error('שגיאה ביצירת הנושא'),
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Topic> & { id: string }) =>
      api.put<TopicRecord>(`/admin/topics/${id}`, topicPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
      toast.success('הנושא עודכן בהצלחה');
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      qc.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: () => toast.error('שגיאה בעדכון הנושא'),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/topics/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
      toast.success('הנושא נמחק בהצלחה');
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      qc.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: () => toast.error('שגיאה במחיקת הנושא'),
  });
}

// ── Subtopics ───────────────────────────────────────────────────────

export function useSubtopics(topicId?: string) {
  return useQuery<Subtopic[]>({
    queryKey: ['subtopics', topicId ?? 'all'],
    queryFn: async () => {
      const topics = await api.get<TopicRecord[]>('/admin/topics');
      const parents = (topicId ? topics.filter(topic => topic.id === topicId) : topics).sort(bySortOrder);
      const records = (await Promise.all(parents.map(async parent =>
        (await api.get<SubtopicRecord[]>(`/admin/topics/${encodeURIComponent(parent.id)}/subtopics`)).sort(bySortOrder),
      ))).flat();
      return records.map(record => ({
        id: record.id, icon: record.icon ?? '',
        name: { he: record.name_he, en: record.name_en, ar: record.name_ar },
        topic_id: record.topic_id,
        topic_name: parents.find(parent => parent.id === record.topic_id)?.name_he ?? '',
        lesson_count: record.lesson_count,
        sort_order: record.sort_order,
        status: record.is_published ? 'published' as const : 'draft' as const,
      }));
    },
  });
}

export function useCreateSubtopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Subtopic>) =>
      api.post<SubtopicRecord>('/admin/subtopics', subtopicPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      qc.invalidateQueries({ queryKey: ['topics'] });
      toast.success('נושא המשנה נוצר בהצלחה');
    },
    onError: () => toast.error('שגיאה ביצירת נושא המשנה'),
  });
}

export function useUpdateSubtopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Subtopic> & { id: string }) =>
      api.put<SubtopicRecord>(`/admin/subtopics/${id}`, subtopicPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('נושא המשנה עודכן בהצלחה');
    },
    onError: () => toast.error('שגיאה בעדכון נושא המשנה'),
  });
}

export function useDeleteSubtopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/subtopics/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtopics'] });
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('נושא המשנה נמחק בהצלחה');
    },
    onError: () => toast.error('שגיאה במחיקת נושא המשנה'),
  });
}
