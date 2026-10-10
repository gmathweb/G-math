import { useEffect, useState, type FormEvent } from 'react';
import { getAdminTopics, createTopic, updateTopic, deleteTopic, getAdminSubtopics } from '../../api/admin';
import type { Topic, Subtopic } from '../../types';

/* ─── Shared Admin Styles ─── */
const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' as const },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1A1A2E' },
  addBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #4CAF50, #388E3C)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  th: { padding: '14px 16px', background: '#F5F7FA', textAlign: 'right' as const, fontWeight: 700, fontSize: '13px', color: '#555770', borderBottom: '2px solid #E8E8EE' },
  td: { padding: '12px 16px', borderBottom: '1px solid #E8E8EE', fontSize: '14px', verticalAlign: 'middle' as const },
  iconCell: { width: '40px', fontSize: '24px' },
  colorDot: (color?: string) => ({
    display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%',
    background: color || '#ccc', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  }),
  actionBtn: (color: string) => ({
    padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 600, fontSize: '12px', color: '#fff', background: color, marginInlineEnd: '6px',
  }),
  expandBtn: {
    padding: '4px 10px', border: '1px solid #E8E8EE', borderRadius: '6px', background: '#F5F7FA',
    cursor: 'pointer', fontSize: '12px',
  },
  badge: (published: boolean) => ({
    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
    background: published ? '#E8F5E9' : '#FFF3E0', color: published ? '#2E7D32' : '#E65100',
  }),
  /* Modal */
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '32px', width: '100%',
    maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', direction: 'rtl' as const,
  },
  modalTitle: { fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#1A1A2E' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  formField: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  formFieldFull: { display: 'flex', flexDirection: 'column' as const, gap: '4px', gridColumn: '1 / -1' },
  label: { fontSize: '12px', fontWeight: 700, color: '#555770' },
  input: { padding: '10px 12px', border: '1.5px solid #E8E8EE', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-start' },
  saveBtn: { padding: '10px 28px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '10px 28px', background: '#F5F7FA', color: '#555770', border: '1.5px solid #E8E8EE', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  subRow: { background: '#FAFBFC', padding: '8px 32px', borderBottom: '1px solid #E8E8EE', fontSize: '13px', color: '#555770' },
  empty: { padding: '40px', textAlign: 'center' as const, color: '#9E9EAF' },
};

const EMPTY_TOPIC: Partial<Topic> = {
  name_he: '', name_en: '', name_ar: '', icon: '', color: '#4CAF50',
  bg_color: '#E8F5E9', description: '', sort_order: 0, is_published: false,
};

export function TopicEditorPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Topic>>(EMPTY_TOPIC);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminTopics(), getAdminSubtopics().catch(() => [])])
      .then(([t, sub]) => { setTopics(t); setSubtopics(sub); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing({ ...EMPTY_TOPIC }); setModalOpen(true); };
  const openEdit = (t: Topic) => { setEditing({ ...t }); setModalOpen(true); };
  const close = () => { setModalOpen(false); setEditing(EMPTY_TOPIC); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing.id) {
        await updateTopic(editing.id, editing);
      } else {
        await createTopic(editing);
      }
      close();
      load();
    } catch (err) {
      alert('שגיאה בשמירה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את הנושא?')) return;
    try {
      await deleteTopic(id);
      load();
    } catch (err) {
      alert('שגיאה במחיקה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const topicSubtopics = (topicId: string) =>
    subtopics.filter((st) => st.topic_id === topicId);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>📚 ניהול נושאים</h1>
        <button style={s.addBtn} onClick={openCreate}>+ נושא חדש</button>
      </div>

      {loading ? (
        <div style={s.empty}>טוען...</div>
      ) : topics.length === 0 ? (
        <div style={s.empty}>אין נושאים עדיין. לחץ "נושא חדש" להוספה.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}></th>
              <th style={s.th}>שם (עברית)</th>
              <th style={s.th}>שם (EN)</th>
              <th style={s.th}>צבע</th>
              <th style={s.th}>תת-נושאים</th>
              <th style={s.th}>שיעורים</th>
              <th style={s.th}>סטטוס</th>
              <th style={s.th}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <>
                <tr key={t.id}>
                  <td style={{ ...s.td, ...s.iconCell }}>{t.icon || '📘'}</td>
                  <td style={s.td}><strong>{t.name_he || t.title}</strong></td>
                  <td style={s.td}>{t.name_en || '—'}</td>
                  <td style={s.td}><span style={s.colorDot(t.color)} /></td>
                  <td style={s.td}>{t.subtopic_count ?? topicSubtopics(t.id).length}</td>
                  <td style={s.td}>{t.lesson_count ?? '—'}</td>
                  <td style={s.td}><span style={s.badge(t.is_published)}>{t.is_published ? 'פורסם' : 'טיוטה'}</span></td>
                  <td style={s.td}>
                    <button style={s.expandBtn} onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                      {expandedId === t.id ? '▲' : '▼'}
                    </button>
                    <button style={s.actionBtn('#1565C0')} onClick={() => openEdit(t)}>✏️ עריכה</button>
                    <button style={s.actionBtn('#d32f2f')} onClick={() => handleDelete(t.id)}>🗑 מחיקה</button>
                  </td>
                </tr>
                {expandedId === t.id && topicSubtopics(t.id).map((sub) => (
                  <tr key={sub.id}>
                    <td colSpan={8} style={s.subRow}>
                      ↳ {sub.name_he || sub.title} &nbsp;
                      <span style={s.badge(sub.is_published)}>{sub.is_published ? 'פורסם' : 'טיוטה'}</span>
                      &nbsp; ({sub.lesson_count ?? (sub.lessons?.length ?? 0)} שיעורים)
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={s.overlay} onClick={close}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editing.id ? 'עריכת נושא' : 'נושא חדש'}</h2>
            <form onSubmit={handleSave}>
              <div style={s.formGrid}>
                <div style={s.formField}>
                  <label style={s.label}>שם (עברית)</label>
                  <input style={s.input} value={editing.name_he || ''} onChange={(e) => setEditing({ ...editing, name_he: e.target.value })} required />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>Name (EN)</label>
                  <input style={{ ...s.input, direction: 'ltr' }} value={editing.name_en || ''} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>اسم (AR)</label>
                  <input style={s.input} value={editing.name_ar || ''} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>אייקון</label>
                  <input style={s.input} value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="📐" />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>צבע</label>
                  <input style={s.input} type="color" value={editing.color || '#4CAF50'} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>צבע רקע</label>
                  <input style={s.input} type="color" value={editing.bg_color || '#E8F5E9'} onChange={(e) => setEditing({ ...editing, bg_color: e.target.value })} />
                </div>
                <div style={s.formFieldFull}>
                  <label style={s.label}>תיאור</label>
                  <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>סדר מיון</label>
                  <input style={s.input} type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>
                    <input type="checkbox" checked={editing.is_published ?? false} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
                    &nbsp;פורסם
                  </label>
                </div>
              </div>
              <div style={s.btnRow}>
                <button type="submit" style={s.saveBtn}>💾 שמירה</button>
                <button type="button" style={s.cancelBtn} onClick={close}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
