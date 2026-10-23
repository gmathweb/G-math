import { useState } from 'react';
import { toast } from 'sonner';
import { useImportTopic } from '../api/importTopic';
import type { TopicImportRequest, TopicImportResult } from '../types';

function parseRequest(text: string): TopicImportRequest {
  const data = JSON.parse(text);
  if (!data || typeof data.topic_slug !== 'string' || !Array.isArray(data.subtopics)) {
    throw new Error('הקובץ חייב לכלול topic_slug ורשימת subtopics');
  }
  return data as TopicImportRequest;
}

export default function ImportPage() {
  const [fileName, setFileName] = useState('');
  const [request, setRequest] = useState<TopicImportRequest | null>(null);
  const [preview, setPreview] = useState<TopicImportResult | null>(null);
  const [parseError, setParseError] = useState('');
  const mutation = useImportTopic();

  async function onFile(file: File | undefined) {
    setPreview(null);
    setRequest(null);
    setParseError('');
    if (!file) return;
    setFileName(file.name);
    try {
      setRequest(parseRequest(await file.text()));
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'קובץ JSON לא תקין');
    }
  }

  async function runPreview() {
    if (!request) return;
    setPreview(await mutation.mutateAsync({ body: request, dryRun: true }));
  }

  async function apply() {
    if (!request) return;
    const res = await mutation.mutateAsync({ body: request, dryRun: false });
    setPreview(null);
    setRequest(null);
    setFileName('');
    toast.success(`הייבוא הושלם: ${res.created.subtopics + res.updated.subtopics} תתי-נושאים, ${res.created.lessons + res.updated.lessons} שיעורים`);
  }

  const lessonCount = request?.subtopics.reduce((n, s) => n + (s.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold">ייבוא תוכן</h1>
        <p className="text-sm text-[var(--ts)]">
          העלאת קובץ JSON עם תתי-נושאים ושיעורים של נושא אחד. הייבוא מחליף את תתי-הנושאים והשיעורים הקיימים של הנושא; שיעורים עם אותו slug נשמרים עם הקבצים שלהם.
        </p>
      </header>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        קובץ JSON
        <input type="file" accept=".json,application/json" className="min-h-11"
          onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>

      {parseError && <p role="alert" className="text-red-700">{parseError}</p>}

      {request && (
        <section className="rounded-lg border border-[var(--bd)] bg-white p-4 flex flex-col gap-3">
          <p><bdi>{fileName}</bdi>: נושא <bdi className="font-semibold">{request.topic_slug}</bdi>, {request.subtopics.length} תתי-נושאים, {lessonCount} שיעורים</p>
          <ul className="text-sm list-disc ps-5">
            {request.subtopics.map((s, i) => (
              <li key={i}>{s.icon} <bdi>{s.name_he}</bdi> / <bdi>{s.name_en}</bdi> / <bdi>{s.name_ar}</bdi> ({s.lessons?.length ?? 0})</li>
            ))}
          </ul>
          <button type="button" disabled={mutation.isPending} onClick={() => void runPreview()}
            className="self-start min-h-11 px-4 py-2 rounded-lg bg-[var(--g-blue)] text-white text-sm font-semibold disabled:opacity-60">
            תצוגה מקדימה
          </button>
        </section>
      )}

      {preview && (
        <section className="rounded-lg border border-[var(--bd)] bg-white p-4 flex flex-col gap-3" aria-live="polite">
          <h2 className="font-bold">מה ישתנה</h2>
          <table className="text-sm">
            <tbody>
              <tr><th className="text-start pe-4">נוצרו</th><td>{preview.created.subtopics} תתי-נושאים, {preview.created.lessons} שיעורים</td></tr>
              <tr><th className="text-start pe-4">יעודכנו</th><td>{preview.updated.subtopics} תתי-נושאים, {preview.updated.lessons} שיעורים</td></tr>
              <tr><th className="text-start pe-4">יימחקו</th><td>{preview.deleted.subtopics} תתי-נושאים, {preview.deleted.lessons} שיעורים</td></tr>
            </tbody>
          </table>
          {preview.deleted.content_files > 0 && (
            <p role="alert" className="text-red-700 font-semibold">
              אזהרה: {preview.deleted.content_files} קבצי תוכן (מצגות/קבצים) יימחקו יחד עם השיעורים שהוסרו.
            </p>
          )}
          <button type="button" disabled={mutation.isPending} onClick={() => void apply()}
            className="self-start min-h-11 px-4 py-2 rounded-lg bg-[var(--g-green)] text-white text-sm font-semibold disabled:opacity-60">
            אישור וייבוא
          </button>
        </section>
      )}
    </div>
  );
}
