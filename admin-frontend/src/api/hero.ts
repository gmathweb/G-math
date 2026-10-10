import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import type { HeroSlide } from '../types';

export function useHeroSlides() {
  return useQuery<HeroSlide[]>({
    queryKey: ['hero'],
    queryFn: () => api.get('/admin/hero'),
  });
}

export function useCreateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HeroSlide>) =>
      api.post<HeroSlide>('/admin/hero', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero'] });
      toast.success('השקופית נוצרה בהצלחה');
    },
    onError: () => toast.error('שגיאה ביצירת השקופית'),
  });
}

export function useUpdateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<HeroSlide> & { id: string }) =>
      api.put<HeroSlide>(`/admin/hero/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero'] });
      toast.success('השקופית עודכנה בהצלחה');
    },
    onError: () => toast.error('שגיאה בעדכון השקופית'),
  });
}

export function useDeleteHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/hero/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero'] });
      toast.success('השקופית נמחקה בהצלחה');
    },
    onError: () => toast.error('שגיאה במחיקת השקופית'),
  });
}
