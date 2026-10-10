import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, BASE_URL, errorMessage } from './client';
import type { UploadedFile } from '../types';

function isUploadedFile(value: unknown): value is UploadedFile {
  return Boolean(
    value && typeof value === 'object'
    && 'id' in value && typeof value.id === 'string'
    && 'lesson_id' in value && typeof value.lesson_id === 'string'
    && 'file_url' in value && typeof value.file_url === 'string'
    && 'display_name' in value && typeof value.display_name === 'string'
    && 'sort_order' in value && typeof value.sort_order === 'number'
    && 'created_at' in value && typeof value.created_at === 'string'
    && 'file_type' in value && ['presentation', 'worksheet', 'geogebra', 'video'].includes(String(value.file_type)),
  );
}

export function useFiles(lessonId?: string) {
  return useQuery<UploadedFile[]>({
    queryKey: lessonId ? ['lesson-files', lessonId] : ['files'],
    queryFn: () => api.get(lessonId ? `/admin/files/lesson/${lessonId}` : '/admin/files'),
  });
}

function useInvalidateFiles() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['files'] });
    void qc.invalidateQueries({ queryKey: ['lesson-files'] });
    void qc.invalidateQueries({ queryKey: ['lessons'] });
  };
}

export function useUploadFile() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({ formData, onProgress }: {
      formData: FormData;
      onProgress?: (pct: number) => void;
    }) => new Promise<UploadedFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('admin_token');
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100));
      });
      xhr.addEventListener('load', () => {
        if (xhr.status === 401) {
          localStorage.removeItem('admin_token');
          reject(new Error('ההתחברות פגה. התחבר מחדש לפני העלאת המצגת.'));
          return;
        }
        let body: unknown;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error(`השרת החזיר תגובה לא תקינה (HTTP ${xhr.status}). נסה שוב.`));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          if (!isUploadedFile(body)) {
            reject(new Error('פרטי הקובץ שהועלה חסרים בתגובת השרת.'));
            return;
          }
          resolve(body);
        } else {
          reject(new Error(errorMessage(body, `ההעלאה נכשלה (HTTP ${xhr.status})`)));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('שגיאת רשת. הקובץ נשמר בטופס; נסה שוב.')));
      xhr.addEventListener('abort', () => reject(new Error('ההעלאה בוטלה.')));
      xhr.open('POST', `${BASE_URL}/admin/files/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    }),
    onSuccess: () => {
      invalidate();
      toast.success('הקובץ הועלה וחובר לשיעור');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteFile() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/files/${id}`),
    onSuccess: () => { invalidate(); toast.success('הקובץ נמחק'); },
  });
}

export function useRenameFile() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({ id, display_name }: { id: string; display_name: string }) =>
      api.patch<UploadedFile>(`/admin/files/${id}`, { display_name }),
    onSuccess: invalidate,
  });
}

export function useReorderFiles() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({ lessonId, fileIds }: { lessonId: string; fileIds: string[] }) =>
      api.put<UploadedFile[]>(`/admin/files/lesson/${lessonId}/order`, { file_ids: fileIds }),
    onSuccess: invalidate,
  });
}

export function useDownloadFile() {
  return async (id: string, filename: string) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${BASE_URL}/admin/files/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(`שגיאה בהורדת הקובץ (HTTP ${response.status})`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const disposition = response.headers.get('content-disposition') ?? '';
    const encodedName = disposition.match(/filename\*=utf-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="([^"]+)"/)?.[1];
    link.href = url;
    link.download = encodedName ? decodeURIComponent(encodedName) : plainName ?? filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
