import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import IconPicker from '../components/IconPicker';
import {
  useTopics,
  useSubtopics,
  useCreateSubtopic,
  useUpdateSubtopic,
  useDeleteSubtopic,
} from '../api/topics';
import type { Subtopic } from '../types';

// ── Subtopic form (uses IconPicker instead of plain ModalForm) ────
function SubtopicForm({
  open,
  onClose,
  editing,
  topicOptions,
  defaultTopicId,
}: {
  open: boolean;
  onClose: () => void;
  editing: Subtopic | null;
  topicOptions: { value: string; label: string }[];
  defaultTopicId: string;
}) {
  const createSubtopic = useCreateSubtopic();
  const updateSubtopic = useUpdateSubtopic();

  const [topicId, setTopicId] = useState(editing?.topic_id ?? defaultTopicId);
  const [nameHe, setNameHe] = useState(editing?.name.he ?? '');
  const [nameEn, setNameEn] = useState(editing?.name.en ?? '');
  const [nameAr, setNameAr] = useState(editing?.name.ar ?? '');
  const [icon, setIcon] = useState(editing?.icon ?? '');
  const [sortOrder, setSortOrder] = useState(String(editing?.sort_order ?? 0));
  const [published, setPublished] = useState(editing ? editing.status === 'published' : true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nameHe.trim()) return;
    const payload = {
      topic_id: topicId,
      icon: icon.trim(),
      name: { he: nameHe, en: nameEn, ar: nameAr },
      sort_order: Number.parseInt(sortOrder, 10) || 0,
      status: published ? 'published' as const : 'draft' as const,
    };

    try {
      setSubmitting(true);
      if (editing) {
        await updateSubtopic.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createSubtopic.mutateAsync(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="px-4 py-2 text-sm text-[var(--ts)] hover:text-[var(--tp)] transition-colors"
      >
        ביטול
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !nameHe.trim() || !topicId}
        className="px-5 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 transition-colors disabled:opacity-50 rounded"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            שומר…
          </span>
        ) : editing ? (
          'עדכן'
        ) : (
          'צור נושא משנה'
        )}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'עריכת נושא משנה' : 'נושא משנה חדש'}
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        {/* Parent topic */}
        <div className="flex flex-col gap-1">
          <label htmlFor="subtopic-parent-topic" className="text-sm font-medium text-[var(--tp)]">
            נושא אב <span className="text-red-500 ms-0.5">*</span>
          </label>
          <select
            id="subtopic-parent-topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--g-green)]"
          >
            <option value="">בחר נושא…</option>
            {topicOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Name HE */}
        <div className="flex flex-col gap-1">
          <label htmlFor="subtopic-name-he" className="text-sm font-medium text-[var(--tp)]">
            שם (עברית) <span className="text-red-500 ms-0.5">*</span>
          </label>
          <input
            id="subtopic-name-he"
            type="text"
            value={nameHe}
            onChange={(e) => setNameHe(e.target.value)}
            placeholder="משוואות"
            className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
          />
        </div>

        {/* Name EN */}
        <div className="flex flex-col gap-1">
          <label htmlFor="subtopic-name-en" className="text-sm font-medium text-[var(--tp)]">שם (אנגלית)</label>
          <input
            id="subtopic-name-en"
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Equations"
            dir="ltr"
            className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
          />
          <span className="text-xs text-[var(--ts)]">ריק = כמו בעברית</span>
        </div>

        {/* Name AR */}
        <div className="flex flex-col gap-1">
          <label htmlFor="subtopic-name-ar" className="text-sm font-medium text-[var(--tp)]">שם (ערבית)</label>
          <input
            id="subtopic-name-ar"
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="المعادلات"
            dir="rtl"
            className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
          />
          <span className="text-xs text-[var(--ts)]">ריק = כמו בעברית</span>
        </div>

        {/* Sort order */}
        <div className="flex flex-col gap-1">
          <label htmlFor="subtopic-sort-order" className="text-sm font-medium text-[var(--tp)]">סדר תצוגה</label>
          <input
            id="subtopic-sort-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
          />
        </div>

        {/* Published */}
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--tp)]">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-[var(--g-green)]"
          />
          פורסם באתר
        </label>

        {/* Icon picker */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--tp)]">אייקון</label>
          <IconPicker
            value={icon}
            onChange={setIcon}
            allowCustom
            emptyHint="ללא אייקון — באתר יוצג סמל ברירת מחדל לפי המיקום"
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function SubtopicsPage() {
  const [searchParams] = useSearchParams();
  const initialTopicId = searchParams.get('topic') ?? '';

  const { data: topics = [] } = useTopics();
  const [filterTopicId, setFilterTopicId] = useState(initialTopicId);
  const [searchText, setSearchText] = useState('');

  const { data: subtopics = [], isLoading } = useSubtopics(filterTopicId || undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Subtopic | null>(null);
  const [deleting, setDeleting] = useState<Subtopic | null>(null);

  const deleteSubtopic = useDeleteSubtopic();

  // ── Filter options ─────────────────────────────────────────────────
  const topicOptions = useMemo(
    () => topics.map((t) => ({ value: t.id, label: `${t.icon} ${t.name.he}` })),
    [topics],
  );

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!searchText.trim()) return subtopics;
    const q = searchText.trim().toLowerCase();
    return subtopics.filter(
      (s) =>
        s.name.he.toLowerCase().includes(q) ||
        s.name.en.toLowerCase().includes(q) ||
        s.topic_name.toLowerCase().includes(q),
    );
  }, [subtopics, searchText]);

  // ── Filter bar callback ────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (filters: Record<string, string>) => {
      setSearchText(filters.search ?? '');
      if (filters.topic !== undefined && filters.topic !== filterTopicId) {
        setFilterTopicId(filters.topic);
      }
    },
    [filterTopicId],
  );

  // ── Handlers ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (sub: Subtopic) => {
    setEditing(sub);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteSubtopic.mutate(deleting.id, { onSettled: () => setDeleting(null) });
  };

  // Topic lookup for badge rendering
  const topicMap = useMemo(
    () => new Map(topics.map((t) => [t.id, t])),
    [topics],
  );

  // ── Table columns ──────────────────────────────────────────────────
  const columns: Column<Subtopic>[] = [
    {
      key: 'name',
      header: 'נושא משנה',
      render: (s) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-lg">{s.icon}</span>
          <span className="font-medium">{s.name.he}</span>
        </span>
      ),
    },
    {
      key: 'topic_name',
      header: 'נושא אב',
      render: (s) => {
        const parent = topicMap.get(s.topic_id);
        return (
          <Badge
            icon={parent?.icon}
            label={s.topic_name}
            color={parent?.color}
            bgColor={parent?.bg_color}
          />
        );
      },
    },
    {
      key: 'lesson_count',
      header: 'שיעורים',
      sortable: true,
      render: (s) => <span className="tabular-nums">{s.lesson_count}</span>,
    },
    {
      key: 'status',
      header: 'סטטוס',
      render: (s) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            s.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {s.status === 'published' ? 'פורסם' : 'טיוטה'}
        </span>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 -m-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">נושאי משנה</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-[var(--g-green)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--g-green)]/90"
        >
          <span>+</span>
          הוסף נושא משנה
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={[{ name: 'topic', label: 'כל הנושאים', options: topicOptions }]}
        searchPlaceholder="חיפוש נושא משנה…"
        onFilterChange={handleFilterChange}
        resultCount={filtered.length}
        resultLabel="תוצאות"
      />

      {/* Table */}
      <DataTable<Record<string, unknown>>
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyIcon="📂"
        emptyMessage="אין נושאי משנה — הוסף את הראשון!"
        actions={(item) => {
          const sub = item as unknown as Subtopic;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(sub)}
                className="text-xs text-blue-600 hover:underline"
              >
                עריכה
              </button>
              <button
                onClick={() => setDeleting(sub)}
                className="text-xs text-red-500 hover:underline"
              >
                מחיקה
              </button>
            </div>
          );
        }}
      />

      {/* Create / Edit modal */}
      <SubtopicForm
        key={formKey}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        topicOptions={topicOptions}
        defaultTopicId={filterTopicId}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        title="מחיקת נושא משנה"
        message={`האם למחוק את "${deleting?.name.he ?? ''}"? פעולה זו לא ניתנת לביטול.`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
