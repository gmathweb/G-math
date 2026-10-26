import { useId, useRef, useState, type FormEvent } from 'react';
import { zip } from 'fflate';
import { useUploadFile } from '../api/files';
import type { Lesson, UploadedFile } from '../types';

const MAX_ZIP_SIZE = 50 * 1024 * 1024;
const MAX_EXTRACTED_SIZE = 200 * 1024 * 1024;

interface Props {
  lessonId?: string;
  lessons?: Lesson[];
  presentationsOnly?: boolean;
  presentationCount?: number;
  onUploaded?: (file: UploadedFile, position: number) => void | Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}

export default function FileUploadForm({
  lessonId, lessons = [], presentationsOnly = false, presentationCount, onUploaded, onBusyChange,
}: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [selectedLesson, setSelectedLesson] = useState(lessonId ?? '');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState('');
  const [type, setType] = useState<UploadedFile['file_type']>('presentation');
  const [source, setSource] = useState<'zip' | 'folder'>('zip');
  const [position, setPosition] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const upload = useUploadFile();
  const busy = upload.isPending || preparing;
  const inputClass = 'w-full min-h-11 border border-[var(--bd)] rounded-lg px-3 py-2 text-sm';
  const effectiveType = presentationsOnly ? 'presentation' : type;
  const isPresentation = effectiveType === 'presentation';
  const folderMode = isPresentation && source === 'folder';
  const effectivePosition = position ?? (presentationCount ?? 0) + 1;
  const hasPayload = folderMode ? folderFiles.length > 0 : !!file;

  function chooseFile(selected: File | undefined) {
    if (!selected || busy) return;
    if (selected.size > 50 * 1024 * 1024) {
      setFile(null);
      if (input.current) input.current.value = '';
      setError('הקובץ גדול מדי. הגודל המרבי הוא 50 MB.');
      return;
    }
    if (presentationsOnly && !selected.name.toLowerCase().endsWith('.zip')) {
      setFile(null);
      if (input.current) input.current.value = '';
      setError('בחר קובץ ZIP המכיל את ייצוא ה-HTML המלא של המצגת.');
      return;
    }
    setFile(selected);
    setError('');
  }

  function chooseSource(next: 'zip' | 'folder') {
    if (busy || next === source) return;
    setSource(next);
    setError('');
    setFile(null);
    setFolderFiles([]);
    setFolderName('');
    if (input.current) input.current.value = '';
    if (folderInput.current) folderInput.current.value = '';
  }

  function relativePath(item: File) {
    return item.webkitRelativePath.split('/').slice(1).join('/');
  }

  function chooseFolder(list: FileList | null) {
    if (!list || busy) return;
    const all = Array.from(list);
    const files = all.filter(item => {
      const rel = relativePath(item);
      return rel && !rel.split('/').some(segment => segment.startsWith('.'));
    });
    if (!files.length) {
      setFolderFiles([]);
      setFolderName('');
      setError('התיקייה ריקה.');
      return;
    }
    const total = files.reduce((sum, item) => sum + item.size, 0);
    if (total > MAX_EXTRACTED_SIZE) {
      setFolderFiles([]);
      setFolderName('');
      setError('התיקייה גדולה מדי. הגודל המרבי לאחר חילוץ הוא 200 MB.');
      return;
    }
    setFolderFiles(files);
    setFolderName(all[0]?.webkitRelativePath.split('/')[0] ?? 'presentation');
    setError('');
  }

  async function zipFolder(): Promise<File> {
    const entries: Record<string, Uint8Array> = {};
    await Promise.all(folderFiles.map(async item => {
      entries[relativePath(item)] = new Uint8Array(await item.arrayBuffer());
    }));
    const zipped = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
      zip(entries, (failure, data) => (failure ? reject(failure) : resolve(new Uint8Array(data))));
    });
    return new File([zipped], `${folderName || 'presentation'}.zip`, { type: 'application/zip' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!hasPayload || !selectedLesson || !name.trim()) {
      setError(folderMode ? 'בחר שיעור ותיקייה והזן שם למצגת.' : 'בחר שיעור וקובץ והזן שם למצגת.');
      return;
    }
    if (!folderMode && file && file.name.toLowerCase().endsWith('.zip') && effectiveType !== 'presentation') {
      setError('קובץ ZIP חייב להיות משויך כמצגת.');
      return;
    }
    setError('');
    setProgress(0);
    onBusyChange?.(true);
    let payload = file;
    if (folderMode) {
      if (!folderFiles.some(item => relativePath(item).toLowerCase() === 'index.html')) {
        setError('לא נמצא קובץ index.html ישירות בתיקייה. בחרו את תיקיית הייצוא המלאה של המצגת.');
        onBusyChange?.(false);
        return;
      }
      setPreparing(true);
      try {
        payload = await zipFolder();
      } catch {
        setError('יצירת קובץ ה-ZIP מהתיקייה נכשלה. נסה שוב.');
        setPreparing(false);
        onBusyChange?.(false);
        return;
      }
      setPreparing(false);
      if (payload.size > MAX_ZIP_SIZE) {
        setError('התיקייה הכווצה חורגת מהגודל המרבי (50 MB). הסירו קבצים מיותרים ונסו שוב.');
        onBusyChange?.(false);
        return;
      }
    }
    if (!payload) {
      setError('בחר שיעור וקובץ והזן שם למצגת.');
      onBusyChange?.(false);
      return;
    }
    const formData = new FormData();
    formData.append('file', payload);
    formData.append('lesson_id', selectedLesson);
    formData.append('file_type', effectiveType);
    formData.append('display_name', name.trim());
    try {
      const uploaded = await upload.mutateAsync({ formData, onProgress: setProgress });
      await onUploaded?.(uploaded, effectivePosition);
      setName('');
      setFile(null);
      setFolderFiles([]);
      setFolderName('');
      setPosition(null);
      if (input.current) input.current.value = '';
      if (folderInput.current) folderInput.current.value = '';
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ההעלאה נכשלה. נסה שוב.');
    } finally {
      onBusyChange?.(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!lessonId && (
        <div>
          <label htmlFor={`${id}-lesson`} className="block text-sm font-semibold mb-1">שיעור</label>
          <select id={`${id}-lesson`} required disabled={busy} className={inputClass}
            value={selectedLesson} onChange={event => setSelectedLesson(event.target.value)}>
            <option value="">בחר שיעור...</option>
            {lessons.map(lesson => (
              <option key={lesson.id} value={lesson.id}>{lesson.topic_name} / {lesson.subtopic_name} / {lesson.name.he}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={`${id}-name`} className="block text-sm font-semibold mb-1">
          {effectiveType === 'presentation' ? 'שם המצגת' : 'שם התוכן'}
        </label>
        <input id={`${id}-name`} required maxLength={300} disabled={busy} className={inputClass}
          value={name} onChange={event => setName(event.target.value)} placeholder="השם שיוצג לתלמידים" />
      </div>
      {presentationsOnly && typeof presentationCount === 'number' && (
        <div>
          <label htmlFor={`${id}-position`} className="block text-sm font-semibold mb-1">מיקום המצגת</label>
          <select id={`${id}-position`} disabled={busy} className={inputClass}
            value={effectivePosition} onChange={event => setPosition(Number(event.target.value))}>
            {Array.from({ length: presentationCount + 1 }, (_, index) => index + 1).map(spot => (
              <option key={spot} value={spot}>{spot}{spot === presentationCount + 1 ? ' (אחרון)' : ''}</option>
            ))}
          </select>
          {presentationCount > 0 && (
            <p className="text-xs text-[var(--ts)] mt-1">בחירת מיקום תפוס תזיז את המצגת שבו ואת כל הבאות אחריה מקום אחד אחורה.</p>
          )}
        </div>
      )}
      {!presentationsOnly && (
        <div>
          <label htmlFor={`${id}-type`} className="block text-sm font-semibold mb-1">סוג התוכן</label>
          <select id={`${id}-type`} value={type} disabled={busy} className={inputClass}
            onChange={event => {
              const value = event.target.value;
              if (value === 'presentation' || value === 'worksheet' || value === 'geogebra' || value === 'video') setType(value);
              if (value !== 'presentation') chooseSource('zip');
            }}>
            <option value="presentation">מצגת</option>
            <option value="worksheet">דף עבודה</option>
            <option value="geogebra">GeoGebra</option>
            <option value="video">סרטון</option>
          </select>
        </div>
      )}
      <div className="rounded-xl border-2 border-dashed border-[var(--bd)] bg-gray-50 p-5"
        onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); if (!folderMode) chooseFile(event.dataTransfer.files[0]); }}>
        {isPresentation && (
          <div role="group" aria-label="מקור המצגת" className="flex gap-2 mb-3">
            <button type="button" disabled={busy} aria-pressed={source === 'zip'} onClick={() => chooseSource('zip')}
              className={`min-h-11 px-3 py-2 text-sm rounded-lg border ${source === 'zip' ? 'border-[var(--g-blue)] bg-[var(--g-blue)] text-white' : 'border-[var(--bd)] hover:bg-gray-100'}`}>
              קובץ ZIP
            </button>
            <button type="button" disabled={busy} aria-pressed={source === 'folder'} onClick={() => chooseSource('folder')}
              className={`min-h-11 px-3 py-2 text-sm rounded-lg border ${source === 'folder' ? 'border-[var(--g-blue)] bg-[var(--g-blue)] text-white' : 'border-[var(--bd)] hover:bg-gray-100'}`}>
              תיקייה
            </button>
          </div>
        )}
        {folderMode ? (
          <>
            <label htmlFor={`${id}-folder`} className="block text-sm font-semibold mb-2">תיקיית המצגת</label>
            <input
              ref={element => { folderInput.current = element; element?.setAttribute('webkitdirectory', ''); }}
              id={`${id}-folder`} type="file" multiple disabled={busy} required={!folderFiles.length}
              className="block w-full min-h-11 text-sm"
              onChange={event => chooseFolder(event.target.files)} />
            <p className="text-sm text-[var(--ts)] mt-2">
              בחרו את תיקיית ייצוא ה-HTML המלאה של המצגת. המערכת תכווץ אותה לקובץ ZIP אוטומטית לפני ההעלאה. ודאו שקובץ index.html נמצא ישירות בתיקייה.
            </p>
            {folderFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm"><bdi>{folderName}/</bdi> · {folderFiles.length} קבצים · <span dir="ltr">{(folderFiles.reduce((sum, item) => sum + item.size, 0) / 1024 / 1024).toFixed(2)} MB</span></p>
                <button type="button" disabled={busy} className="min-h-11 text-sm text-red-700"
                  onClick={() => { setFolderFiles([]); setFolderName(''); if (folderInput.current) folderInput.current.value = ''; }}>
                  הסרת התיקייה שנבחרה
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <label htmlFor={`${id}-file`} className="block text-sm font-semibold mb-2">
              {presentationsOnly ? 'קובץ ZIP' : 'קובץ'}
            </label>
        <input ref={input} id={`${id}-file`} type="file" disabled={busy} required={!file}
          accept={presentationsOnly ? '.zip,application/zip' : '.zip,.pdf,.pptx,.html,.ggb,.mp4'}
          className="block w-full min-h-11 text-sm"
          onChange={event => chooseFile(event.target.files?.[0])} />
        <p className="text-sm text-[var(--ts)] mt-2">
          גררו קובץ לכאן או בחרו קובץ. למצגת אינטראקטיבית, העלו את ייצוא ה-HTML המלא כ-ZIP, בלי לפתוח או לשנות קבצים בתוכו.
        </p>
        <p className="text-xs text-[var(--ts)] mt-1">עד 50 MB לקובץ ZIP, עד 200 MB לאחר חילוץ.</p>
        {file && (
          <div className="mt-3">
            <p className="text-sm"><bdi>{file.name}</bdi> · <span dir="ltr">{(file.size / 1024 / 1024).toFixed(2)} MB</span></p>
            <button type="button" disabled={busy} className="min-h-11 text-sm text-red-700"
              onClick={() => { setFile(null); if (input.current) input.current.value = ''; }}>
              הסרת הקובץ שנבחר
            </button>
          </div>
        )}
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {busy && (
        <div role="status" className="text-sm">
          <p>{preparing ? 'מכווץ את התיקייה לקובץ ZIP…' : progress < 100 ? `מעלה… ${progress}%` : 'ההעברה הסתיימה. בודק ומכין את המצגת…'}</p>
          {!preparing && <progress className="w-full mt-2" max={100} value={progress} aria-label="התקדמות העלאה" />}
          <p className="text-xs text-[var(--ts)]">המתן לסיום לפני סגירת החלון.</p>
        </div>
      )}
      <button type="submit" disabled={busy || !hasPayload || !selectedLesson || !name.trim()}
        className="self-start min-h-11 px-5 py-2 rounded-lg bg-[var(--g-blue)] text-white text-sm font-semibold disabled:opacity-50">
        {busy ? (preparing ? 'מכין את התיקייה…' : 'מעלה ומכין…') : effectiveType === 'presentation' ? 'העלאת מצגת' : 'העלאת קובץ'}
      </button>
    </form>
  );
}
