import { useId, useRef, useState, type FormEvent } from 'react';
import { useUploadFile } from '../api/files';
import type { Lesson, UploadedFile } from '../types';

interface Props {
  lessonId?: string;
  lessons?: Lesson[];
  presentationsOnly?: boolean;
  onUploaded?: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function FileUploadForm({
  lessonId, lessons = [], presentationsOnly = false, onUploaded, onBusyChange,
}: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selectedLesson, setSelectedLesson] = useState(lessonId ?? '');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<UploadedFile['file_type']>('presentation');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const upload = useUploadFile();
  const busy = upload.isPending;
  const inputClass = 'w-full min-h-11 border border-[var(--bd)] rounded-lg px-3 py-2 text-sm';
  const effectiveType = presentationsOnly ? 'presentation' : type;

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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!file || !selectedLesson || !name.trim()) {
      setError('בחר שיעור וקובץ והזן שם למצגת.');
      return;
    }
    if (file.name.toLowerCase().endsWith('.zip') && effectiveType !== 'presentation') {
      setError('קובץ ZIP חייב להיות משויך כמצגת.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lesson_id', selectedLesson);
    formData.append('file_type', effectiveType);
    formData.append('display_name', name.trim());
    setError('');
    setProgress(0);
    onBusyChange?.(true);
    try {
      await upload.mutateAsync({ formData, onProgress: setProgress });
      setName('');
      setFile(null);
      if (input.current) input.current.value = '';
      onUploaded?.();
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
      {!presentationsOnly && (
        <div>
          <label htmlFor={`${id}-type`} className="block text-sm font-semibold mb-1">סוג התוכן</label>
          <select id={`${id}-type`} value={type} disabled={busy} className={inputClass}
            onChange={event => {
              const value = event.target.value;
              if (value === 'presentation' || value === 'worksheet' || value === 'geogebra' || value === 'video') setType(value);
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
        onDrop={event => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}>
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
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {busy && (
        <div role="status" className="text-sm">
          <p>{progress < 100 ? `מעלה… ${progress}%` : 'ההעברה הסתיימה. בודק ומכין את המצגת…'}</p>
          <progress className="w-full mt-2" max={100} value={progress} aria-label="התקדמות העלאה" />
          <p className="text-xs text-[var(--ts)]">המתן לסיום לפני סגירת החלון.</p>
        </div>
      )}
      <button type="submit" disabled={busy || !file || !selectedLesson || !name.trim()}
        className="self-start min-h-11 px-5 py-2 rounded-lg bg-[var(--g-blue)] text-white text-sm font-semibold disabled:opacity-50">
        {busy ? 'מעלה ומכין…' : effectiveType === 'presentation' ? 'העלאת מצגת' : 'העלאת קובץ'}
      </button>
    </form>
  );
}
