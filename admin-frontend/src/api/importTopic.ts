import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { TopicImportRequest, TopicImportResult } from '../types';

export function useImportTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, dryRun }: { body: TopicImportRequest; dryRun: boolean }) =>
      api.post<TopicImportResult>(`/admin/import/topic?dry_run=${dryRun}`, body),
    onSuccess: (res) => {
      if (res.applied) qc.invalidateQueries();
    },
  });
}
