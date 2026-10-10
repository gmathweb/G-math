import { useState, useMemo } from 'react';
import { useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from '../api/lessons';
import { useTopics, useSubtopics } from '../api/topics';
import DataTable, { type Column } from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import ModalForm from '../components/ModalForm';
import type { FormField } from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import PresentationManager from '../components/PresentationManager';
import type { Lesson } from '../types';

type LessonRow = Lesson & Record<string, unknown>;

export default function LessonsPage() {
  // ── Filter state ────────────────────────────────────────────────────
  const [filterTopicId, setFilterTopicId] = useState<string>('');
  const [filterSubtopicId, setFilterSubtopicId] = useState<string>('');
  const [search, setSearch] = useState('');

  // ── Modal state ─────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Lesson | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [presentationLesson, setPresentationLesson] = useState<Lesson | null>(null);

  // ── Cascading form state (for create/edit modals) ───────────────────
  const [formTopicId, setFormTopicId] = useState<string>('');

  // ── Data hooks ──────────────────────────────────────────────────────
  const { data: topics = [] } = useTopics();
  const { data: allSubtopics = [] } = useSubtopics();
  const { data: lessons = [], isLoading, error: lessonsError } = useLessons(
    filterTopicId || undefined,
    filterSubtopicId || undefined,
  );
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  // ── Derived ─────────────────────────────────────────────────────────
  const filteredSubtopics = useMemo(
    () => (filterTopicId ? allSubtopics.filter((s) => s.topic_id === filterTopicId) : allSubtopics),
    [allSubtopics, filterTopicId],
  );

  const formSubtopics = useMemo(
    () => (formTopicId ? allSubtopics.filter((s) => s.topic_id === formTopicId) : []),
    [allSubtopics, formTopicId],
  );

  const filtered = useMemo(() => {
    if (!search) return lessons;
    const q = search.toLowerCase();
    return lessons.filter(
      (l) =>
        l.name.he.toLowerCase().includes(q) ||
        l.name.en.toLowerCase().includes(q) ||
        l.subtopic_name.toLowerCase().includes(q) ||
        l.topic_name.toLowerCase().includes(q),
    );
  }, [lessons, search]);

  // ── Filter bar config ───────────────────────────────────────────────
  const topicOptions = topics.map((t) => ({ value: t.id, label: t.name.he }));
  const subtopicOptions = filteredSubtopics.map((s) => ({ value: s.id, label: s.name.he }));

  const handleFilterChange = (f: Record<string, string>) => {
    setSearch(f.search ?? '');
    if (f.topic !== undefined && f.topic !== filterTopicId) {
      setFilterTopicId(f.topic);
      setFilterSubtopicId('');
    }
    if (f.subtopic !== undefined) {
      setFilterSubtopicId(f.subtopic);
    }
  };

  // ── Create form fields (cascading) ─────────────────────────────────
  const createFields: FormField[] = useMemo(() => [
    {
      name: 'topic_id',
      label: 'נושא',
      type: 'select',
      required: true,
      placeholder: 'בחר נושא...',
      options: topics.map((t) => ({ value: t.id, label: t.name.he })),
    },
    {
      name: 'subtopic_id',
      label: 'תת-נושא',
      type: 'select',
      required: true,
      dependsOn: 'topic_id',
      placeholder: formTopicId ? 'בחר תת-נושא...' : 'בחר נושא קודם',
      options: formSubtopics.map((s) => ({ value: s.id, label: s.name.he })),
    },
    { name: 'name_he', label: 'שם (עברית)', type: 'text', required: true, placeholder: 'שם השיעור בעברית' },
    { name: 'name_en', label: 'Name (English)', type: 'text', placeholder: 'Lesson name in English' },
  ], [topics, formSubtopics, formTopicId]);

  // ── Edit form fields (cascading) ───────────────────────────────────
  const editFields: FormField[] = useMemo(() => [
    {
      name: 'topic_id',
      label: 'נושא',
      type: 'select',
      required: true,
      defaultValue: editItem?.topic_id ?? '',
      options: topics.map((t) => ({ value: t.id, label: t.name.he })),
    },
    {
      name: 'subtopic_id',
      label: 'תת-נושא',
      type: 'select',
      required: true,
      dependsOn: 'topic_id',
      defaultValue: editItem?.subtopic_id ?? '',
      placeholder: formTopicId ? 'בחר תת-נושא...' : 'בחר נושא קודם',
      options: formSubtopics.map((s) => ({ value: s.id, label: s.name.he })),
    },
    {
      name: 'name_he',
      label: 'שם (עברית)',
      type: 'text',
      required: true,
      defaultValue: editItem?.name.he ?? '',
    },
    {
      name: 'name_en',
      label: 'Name (English)',
      type: 'text',
      defaultValue: editItem?.name.en ?? '',
    },
  ], [topics, formSubtopics, formTopicId, editItem]);

  // ── Handlers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormTopicId('');
    setCreateOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditItem(lesson);
    setFormTopicId(lesson.topic_id);
    setEditOpen(true);
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  // ── Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      header: 'שם השיעור',
      sortable: true,
      render: (l: Lesson) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <span>📖</span>
          {l.name.he}
        </span>
      ),
    },
    {
      key: 'subtopic_name',
      header: 'תת-נושא',
      sortable: true,
      render: (l: Lesson) => l.subtopic_name,
    },
    {
      key: 'topic_name',
      header: 'נושא',
      render: (l: Lesson) => <Badge label={l.topic_name} />,
    },
    {
      key: 'file_count',
      header: 'קבצים',
      sortable: true,
      width: '90px',
      render: (l: Lesson) => (
        <span className="text-[var(--ts)]">{l.file_count}</span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '110px',
      render: (l: Lesson) =>
        l.status === 'published' ? (
          <Badge icon="✅" label="פורסם" color="#059669" bgColor="#d1fae5" />
        ) : (
          <Badge icon="📝" label="טיוטה" color="#d97706" bgColor="#fef3c7" />
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">שיעורים</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 rounded transition-colors"
        >
          + הוסף שיעור חדש
        </button>
      </div>

      {/* FilterBar with cascading topic → subtopic */}
      <FilterBar
        searchPlaceholder="חיפוש שיעור..."
        filters={[
          { name: 'topic', label: 'כל הנושאים', options: topicOptions },
          { name: 'subtopic', label: 'כל תתי-הנושאים', options: subtopicOptions },
        ]}
        onFilterChange={handleFilterChange}
        resultCount={filtered.length}
        resultLabel="שיעורים"
      />

      {/* Table */}
      {lessonsError && <p role="alert" className="text-red-700">לא ניתן לטעון את השיעורים: {lessonsError.message}</p>}
      <DataTable<LessonRow>
        columns={columns as Column<LessonRow>[]}
        data={filtered as LessonRow[]}
        loading={isLoading}
        emptyIcon="📖"
        emptyMessage="לא נמצאו שיעורים"
        actions={(item) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPresentationLesson(item)}
              className="min-h-11 px-3 py-2 text-sm rounded-lg border border-[var(--bd)] text-[var(--g-blue)] hover:bg-blue-50"
              aria-label={`מצגות: ${item.name.he}`}
            >
              מצגות
            </button>
            <button
              onClick={() => openEdit(item)}
              className="p-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="עריכה"
              aria-label="עריכה"
            >
              ✏️
            </button>
            <button
              onClick={() => openDelete(item.id)}
              className="p-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded hover:bg-red-50 transition-colors"
              title="מחיקה"
              aria-label="מחיקה"
            >
              🗑️
            </button>
          </div>
        )}
      />

      {/* Create Modal — intercept topic_id changes for cascading */}
      {presentationLesson && (
        <PresentationManager key={presentationLesson.id} lesson={presentationLesson} onClose={() => setPresentationLesson(null)} />
      )}
      {createOpen && (
        <LessonFormModal
          open={createOpen}
          title="הוסף שיעור חדש"
          fields={createFields}
          formTopicId={formTopicId}
          onTopicChange={setFormTopicId}
          onSubmit={async (data) => {
            await createLesson.mutateAsync({
              subtopic_id: data.subtopic_id,
              name_he: data.name_he,
              name_en: data.name_en,
            });
            setCreateOpen(false);
          }}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {editOpen && editItem && (
        <LessonFormModal
          open={editOpen}
          title="עריכת שיעור"
          fields={editFields}
          formTopicId={formTopicId}
          onTopicChange={setFormTopicId}
          onSubmit={async (data) => {
            await updateLesson.mutateAsync({
              id: editItem.id,
              subtopic_id: data.subtopic_id,
              name_he: data.name_he,
              name_en: data.name_en,
            });
            setEditOpen(false);
            setEditItem(null);
          }}
          onClose={() => { setEditOpen(false); setEditItem(null); }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="מחיקת שיעור"
        message="האם אתה בטוח שברצונך למחוק שיעור זה? פעולה זו אינה ניתנת לביטול."
        confirmLabel="מחק"
        variant="danger"
        onConfirm={async () => {
          if (deleteId) await deleteLesson.mutateAsync(deleteId);
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onCancel={() => { setDeleteOpen(false); setDeleteId(null); }}
      />
    </div>
  );
}

// ── Cascading Form Modal ──────────────────────────────────────────────
// Wraps ModalForm but listens for topic_id select changes to trigger cascading subtopic refresh

interface LessonFormModalProps {
  open: boolean;
  title: string;
  fields: FormField[];
  formTopicId: string;
  onTopicChange: (topicId: string) => void;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

function LessonFormModal({ open, title, fields, onTopicChange, onSubmit, onClose }: LessonFormModalProps) {
  return (
    <ModalForm
      open={open}
      title={title}
      fields={fields}
      submitLabel="שמור"
      onSubmit={onSubmit}
      onClose={onClose}
      onFieldChange={(name, value) => {
        if (name === 'topic_id') onTopicChange(value);
      }}
    />
  );
}
