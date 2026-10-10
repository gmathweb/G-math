import { useState } from 'react';
import { useFiles, useDeleteFile, useDownloadFile, useRenameFile, useReorderFiles } from '../api/files';
import { PresentationViewer, type ViewerLabels } from '../../../frontend/src/components/content/PresentationViewer';
import Modal from './Modal';
import FileUploadForm from './FileUploadForm';
import type { Lesson, UploadedFile } from '../types';

const labels: ViewerLabels = {
  fullPage: 'תצוגת עמוד מלא', exitFullPage: 'יציאה מתצוגת עמוד מלא',
  expanded: 'תצוגת עמוד מלא', loading: 'טוען מצגת…',
  slow: 'טעינת המצגת נמשכת יותר מהרגיל.',
  retry: 'טעינה מחדש של המצגת', open: 'פתיחה בלשונית חדשה',
  unsupported: 'קובץ זה אינו ניתן להצגה בדפדפן. אפשר לפתוח או להוריד אותו.',
  controls: 'פקדי המצגת',
  navigation: 'מצגות', expandNavigation: 'הצגת המצגות', collapseNavigation: 'הסתרת המצגות',
  page: 'עמוד',
  previousPage: 'העמוד הקודם', nextPage: 'העמוד הבא',
  nativeNavigation: 'אפשר לנווט באמצעות פקדי המצגת עצמה.',
  navigationError: 'לא ניתן לפתוח את העמוד. נסו שוב.',
  resources: 'חומרי השיעור',
};

export default function PresentationManager({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { data: files = [], isLoading, error: loadError, refetch } = useFiles(lesson.id);
  const remove = useDeleteFile();
  const rename = useRenameFile();
  const reorder = useReorderFiles();
  const download = useDownloadFile();
  const [uploading, setUploading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const [error, setError] = useState('');
  const presentations = files.filter(file => file.file_type === 'presentation');
  const preview = presentations.find(file => file.id === previewId);
  const busy = uploading || remove.isPending || rename.isPending || reorder.isPending;
  const buttonClass = 'min-h-11 px-3 py-2 text-sm rounded-lg border border-[var(--bd)] hover:bg-gray-50 disabled:opacity-40';

  async function act(action: () => Promise<unknown>) {
    setError('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'הפעולה נכשלה. נסה שוב.'); }
  }

  async function move(file: UploadedFile, offset: number) {
    const position = presentations.indexOf(file);
    const neighbor = presentations[position + offset];
    if (!neighbor) return;
    const ids = files.map(item => item.id);
    const from = ids.indexOf(file.id);
    const to = ids.indexOf(neighbor.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await act(() => reorder.mutateAsync({ lessonId: lesson.id, fileIds: ids }));
  }

  return (
    <Modal open wide fitHeight={!!preview} title={`מצגות: ${lesson.name.he}`} closeDisabled={busy}
      onClose={() => { if (!busy) onClose(); }}>
      <div className={`flex flex-col ${preview ? 'h-full min-h-0 gap-2' : 'gap-5'}`}>
        {!preview && <p className="text-sm text-[var(--ts)]">{lesson.topic_name} / {lesson.subtopic_name} / <strong>{lesson.name.he}</strong></p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {preview ? (
          <>
            <button type="button" onClick={() => setPreviewId(null)} className={`${buttonClass} self-start shrink-0`}>חזרה לניהול המצגות</button>
            <PresentationViewer url={preview.file_url} title={preview.display_name} labels={labels}
              files={presentations} activeId={preview.id} onSelect={setPreviewId}
              resources={files.filter(file => file.file_type !== 'presentation')} />
          </>
        ) : (
          <>
            <section className="rounded-xl border border-[var(--bd)] p-4">
              <h3 className="font-semibold mb-3">הוספת מצגת לשיעור</h3>
              <FileUploadForm lessonId={lesson.id} presentationsOnly onBusyChange={setUploading} />
            </section>
            <section aria-label="מצגות השיעור">
              <h3 className="font-semibold mb-3">מצגות השיעור ({presentations.length})</h3>
              {isLoading && <p role="status">טוען מצגות…</p>}
              {loadError && <p role="alert">לא ניתן לטעון את המצגות. <button className={buttonClass} onClick={() => void refetch()}>נסה שוב</button></p>}
              {!isLoading && !loadError && presentations.length === 0 && <p className="text-sm text-[var(--ts)]">עדיין אין מצגות. העלו מצגת עם שם וקובץ ZIP.</p>}
              <ol className="flex flex-col gap-3">
                {presentations.map((file, index) => (
                  <li key={file.id} className="rounded-xl border border-[var(--bd)] p-3">
                    {editingId === file.id ? (
                      <form className="flex flex-wrap gap-2" onSubmit={event => {
                        event.preventDefault();
                        void act(async () => { await rename.mutateAsync({ id: file.id, display_name: name.trim() }); setEditingId(null); });
                      }}>
                        <label className="flex-1 min-w-0">שם המצגת
                          <input required maxLength={300} value={name} onChange={event => setName(event.target.value)}
                            className="w-full border rounded-lg p-2" autoFocus />
                        </label>
                        <button className={buttonClass} disabled={busy || !name.trim()} type="submit">שמירת שם</button>
                        <button className={buttonClass} disabled={busy} type="button" onClick={() => setEditingId(null)}>ביטול</button>
                      </form>
                    ) : (
                      <>
                        <p className="font-semibold mb-2"><span dir="ltr">{index + 1}.</span> <bdi>{file.display_name}</bdi></p>
                        <div className="flex flex-wrap gap-2">
                          <button className={buttonClass} disabled={busy} onClick={() => setPreviewId(file.id)}>תצוגה מקדימה</button>
                          <button className={buttonClass} disabled={busy} onClick={() => { setName(file.display_name); setEditingId(file.id); }}>שינוי שם</button>
                          <button className={buttonClass} disabled={busy || index === 0} aria-label={`הזז מוקדם יותר: ${file.display_name}`} onClick={() => void move(file, -1)}>מוקדם יותר</button>
                          <button className={buttonClass} disabled={busy || index === presentations.length - 1} aria-label={`הזז מאוחר יותר: ${file.display_name}`} onClick={() => void move(file, 1)}>מאוחר יותר</button>
                          <button className={buttonClass} disabled={busy} onClick={() => void act(() => download(file.id, file.display_name))}>הורדת המקור</button>
                          <button className={`${buttonClass} text-red-700`} disabled={busy} onClick={() => setDeleteTarget(file)}>הסרה</button>
                        </div>
                        {deleteTarget?.id === file.id && (
                          <div role="alertdialog" aria-label="אישור הסרת מצגת" className="mt-3 p-3 rounded-lg bg-red-50">
                            <p className="text-sm">להסיר את "{file.display_name}" מהשיעור "{lesson.name.he}"? המצגת והקבצים שלה יימחקו ולא יהיו זמינים לתלמידים.</p>
                            <div className="flex gap-2 mt-2">
                              <button className={buttonClass} disabled={busy} autoFocus onClick={() => setDeleteTarget(null)}>ביטול</button>
                              <button className={`${buttonClass} text-red-700`} disabled={busy} onClick={() => void act(async () => {
                                await remove.mutateAsync(file.id);
                                setDeleteTarget(null);
                              })}>אישור הסרה</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
