import { useMemo, useState } from 'react';
import DataTable, { type Column } from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploadForm from '../components/FileUploadForm';
import PresentationManager from '../components/PresentationManager';
import { useFiles, useDeleteFile, useDownloadFile } from '../api/files';
import { useLessons } from '../api/lessons';
import type { Lesson, UploadedFile } from '../types';

type FileRow = UploadedFile & Record<string, unknown>;
const typeLabels = { presentation: 'מצגת', worksheet: 'דף עבודה', geogebra: 'GeoGebra', video: 'סרטון' };

export default function FilesPage() {
  const { data: files = [], isLoading, error: loadError } = useFiles();
  const { data: lessons = [], error: lessonsError } = useLessons();
  const remove = useDeleteFile();
  const download = useDownloadFile();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const [presentationLesson, setPresentationLesson] = useState<Lesson | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({ search: '', type: '' });
  const [error, setError] = useState('');
  const lessonsById = useMemo(() => new Map(lessons.map(lesson => [lesson.id, lesson])), [lessons]);
  const filtered = files.filter(file =>
    (!filters.search || file.display_name.toLowerCase().includes(filters.search.toLowerCase()))
    && (!filters.type || file.file_type === filters.type),
  );
  const columns: Column<FileRow>[] = [
    { key: 'display_name', header: 'שם התוכן', sortable: true,
      render: file => <bdi className="font-semibold">{file.display_name}</bdi> },
    { key: 'file_type', header: 'סוג', render: file => typeLabels[file.file_type] },
    { key: 'lesson_id', header: 'שיעור', render: file => lessonsById.get(file.lesson_id)?.name.he ?? file.lesson_id },
    { key: 'created_at', header: 'תאריך העלאה', sortable: true,
      render: file => new Date(file.created_at).toLocaleDateString('he-IL') },
  ];
  async function act(action: () => Promise<unknown>) {
    setError('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'הפעולה נכשלה. נסה שוב.'); }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">קבצים</h1><p className="text-sm text-[var(--ts)]">כל קובץ מחובר לשיעור. למצגות ZIP אפשר להוסיף שם ולנהל את סדר ההצגה.</p></div>
        <button type="button" onClick={() => setUploadOpen(true)}
          className="min-h-11 px-4 py-2 rounded-lg bg-[var(--g-blue)] text-white text-sm font-semibold">העלאת קובץ חדש</button>
      </header>
      {(error || loadError || lessonsError) && <p role="alert" className="text-red-700">{error || loadError?.message || lessonsError?.message}</p>}
      <FilterBar searchPlaceholder="חיפוש לפי שם התוכן…" filters={[
        { name: 'type', label: 'כל סוגי התוכן', options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })) },
      ]} onFilterChange={setFilters} resultCount={filtered.length} resultLabel="קבצים" />
      <DataTable<FileRow> columns={columns} data={filtered as FileRow[]} loading={isLoading}
        emptyIcon="📂" emptyMessage="אין קבצים להצגה"
        actions={file => {
          const lesson = lessonsById.get(file.lesson_id);
          return (
            <div className="flex flex-wrap gap-2">
              {lesson && file.file_type === 'presentation' && (
                <button type="button" className="min-h-11 px-2 text-[var(--g-blue)]" onClick={() => setPresentationLesson(lesson)}>ניהול מצגות</button>
              )}
              <button type="button" className="min-h-11 px-2" onClick={() => void act(() => download(file.id, file.display_name))}>הורדה</button>
              <button type="button" className="min-h-11 px-2 text-red-700" onClick={() => setDeleteTarget(file)}>מחיקה</button>
            </div>
          );
        }} />
      {uploadOpen && (
        <Modal open title="העלאת קובץ לשיעור" closeDisabled={uploading} onClose={() => { if (!uploading) setUploadOpen(false); }}>
          <FileUploadForm lessons={lessons} onBusyChange={setUploading} onUploaded={() => setUploadOpen(false)} />
        </Modal>
      )}
      {presentationLesson && (
        <PresentationManager key={presentationLesson.id} lesson={presentationLesson} onClose={() => setPresentationLesson(null)} />
      )}
      <ConfirmDialog open={Boolean(deleteTarget)} title="מחיקת קובץ"
        message={`למחוק את "${deleteTarget?.display_name}" מהשיעור "${deleteTarget ? lessonsById.get(deleteTarget.lesson_id)?.name.he ?? '' : ''}"? הקובץ לא יהיה זמין לתלמידים.`}
        confirmLabel={remove.isPending ? 'מוחק…' : 'מחק'} variant="danger"
        onCancel={() => { if (!remove.isPending) setDeleteTarget(null); }}
        onConfirm={() => {
          if (!deleteTarget || remove.isPending) return;
          void act(async () => { await remove.mutateAsync(deleteTarget.id); setDeleteTarget(null); });
        }} />
    </div>
  );
}
