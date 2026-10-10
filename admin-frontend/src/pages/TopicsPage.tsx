import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import ModalForm from '../components/ModalForm';
import type { FormField } from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '../api/topics';
import type { Topic } from '../types';

export default function TopicsPage() {
  const navigate = useNavigate();
  const { data: topics = [], isLoading } = useTopics();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);

  // ── Form fields ────────────────────────────────────────────────────
  const formFields: FormField[] = useMemo(
    () => [
      {
        name: 'icon',
        label: 'אייקון',
        type: 'text' as const,
        placeholder: '📚',
        defaultValue: editing?.icon ?? '',
      },
      {
        name: 'name_he',
        label: 'שם (עברית)',
        type: 'text' as const,
        required: true,
        placeholder: 'אלגברה',
        defaultValue: editing?.name.he ?? '',
      },
      {
        name: 'name_en',
        dir: 'ltr' as const,
        label: 'שם (אנגלית) — ריק = כמו בעברית',
        type: 'text' as const,
        placeholder: 'Algebra',
        defaultValue: editing?.name.en ?? '',
      },
      {
        name: 'name_ar',
        dir: 'rtl' as const,
        label: 'שם (ערבית) — ריק = כמו בעברית',
        type: 'text' as const,
        placeholder: 'الجبر',
        defaultValue: editing?.name.ar ?? '',
      },
      {
        name: 'description_he',
        label: 'תיאור (עברית)',
        type: 'textarea' as const,
        placeholder: 'תיאור קצר של הנושא…',
        defaultValue: editing?.description.he ?? '',
      },
      {
        name: 'description_en',
        dir: 'ltr' as const,
        label: 'תיאור (אנגלית)',
        type: 'textarea' as const,
        defaultValue: editing?.description.en ?? '',
      },
      {
        name: 'description_ar',
        dir: 'rtl' as const,
        label: 'תיאור (ערבית)',
        type: 'textarea' as const,
        defaultValue: editing?.description.ar ?? '',
      },
      {
        name: 'color',
        label: 'צבע',
        type: 'color' as const,
        placeholder: 'בחר צבע נושא',
        defaultValue: editing?.color ?? '#22c55e',
      },
      {
        name: 'bg_color',
        label: 'צבע רקע לאייקון',
        type: 'color' as const,
        defaultValue: editing?.bg_color ?? '#f0fdf4',
      },
      {
        name: 'sort_order',
        label: 'סדר תצוגה',
        type: 'number' as const,
        defaultValue: String(editing?.sort_order ?? topics.length),
      },
      {
        name: 'status',
        label: 'סטטוס',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'published', label: 'פורסם' },
          { value: 'draft', label: 'טיוטה' },
        ],
        defaultValue: editing?.status ?? 'published',
      },
    ],
    [editing, topics.length],
  );

  // ── Handlers ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditing(topic);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Record<string, string>) => {
    const payload = {
      icon: data.icon,
      name: { he: data.name_he, en: data.name_en, ar: data.name_ar },
      description: {
        he: data.description_he,
        en: data.description_en,
        ar: data.description_ar,
      },
      color: data.color,
      bg_color: data.bg_color,
      sort_order: Number.parseInt(data.sort_order, 10) || 0,
      status: data.status === 'draft' ? 'draft' as const : 'published' as const,
    };

    if (editing) {
      await updateTopic.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createTopic.mutateAsync(payload);
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteTopic.mutate(deleting.id, { onSettled: () => setDeleting(null) });
  };

  // ── Table columns ──────────────────────────────────────────────────
  const columns: Column<Topic>[] = [
    {
      key: 'sort_order',
      header: 'סדר',
      sortable: true,
      render: (t) => <span className="tabular-nums">{t.sort_order}</span>,
    },
    {
      key: 'name',
      header: 'נושא',
      render: (t) => (
        <Badge icon={t.icon} label={t.name.he} color={t.color} bgColor={t.bg_color} />
      ),
    },
    {
      key: 'subtopic_count',
      header: 'נושאי משנה',
      sortable: true,
      render: (t) => <span className="tabular-nums">{t.subtopic_count}</span>,
    },
    {
      key: 'lesson_count',
      header: 'שיעורים',
      sortable: true,
      render: (t) => <span className="tabular-nums">{t.lesson_count}</span>,
    },
    {
      key: 'status',
      header: 'סטטוס',
      render: (t) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            t.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {t.status === 'published' ? 'פורסם' : 'טיוטה'}
        </span>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 -m-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">נושאים</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-[var(--g-green)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--g-green)]/90"
        >
          <span>+</span>
          הוסף נושא חדש
        </button>
      </div>

      {/* Table */}
      <DataTable<Record<string, unknown>>
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={topics as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyIcon="📚"
        emptyMessage="עדיין אין נושאים — הוסף את הראשון!"
        actions={(item) => {
          const topic = item as unknown as Topic;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/admin/subtopics?topic=${topic.id}`)}
                className="text-xs text-[var(--g-green)] hover:underline"
              >
                נושאי משנה
              </button>
              <button
                onClick={() => openEdit(topic)}
                className="text-xs text-blue-600 hover:underline"
              >
                עריכה
              </button>
              <button
                onClick={() => setDeleting(topic)}
                className="text-xs text-red-500 hover:underline"
              >
                מחיקה
              </button>
            </div>
          );
        }}
      />

      {/* Create / Edit modal */}
      <ModalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'עריכת נושא' : 'נושא חדש'}
        fields={formFields}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'עדכן' : 'צור נושא'}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        title="מחיקת נושא"
        message={`האם למחוק את הנושא "${deleting?.name.he ?? ''}"? פעולה זו לא ניתנת לביטול.`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
