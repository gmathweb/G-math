import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import type { AppSettings } from '../types';

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/admin/settings'),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppSettings) =>
      api.put<AppSettings>('/admin/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('ההגדרות נשמרו בהצלחה');
    },
    onError: () => toast.error('שגיאה בשמירת ההגדרות'),
  });
}

interface SettingsEnvelope { settings: Record<string, string> }

export function useSiteSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ['site-settings'],
    queryFn: async () => (await api.get<SettingsEnvelope>('/admin/settings')).settings,
    // The Home content form remounts on new data; only refetch after a save so drafts survive.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSaveSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, string>) =>
      api.put<SettingsEnvelope>('/admin/settings', { settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('תוכן דף הבית נשמר');
    },
    onError: () => toast.error('שגיאה בשמירת תוכן דף הבית'),
  });
}
