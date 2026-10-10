import { useEffect, useState, type FormEvent } from 'react';
import { getAdminSubtopics, getAdminTopics, createSubtopic, updateSubtopic, deleteSubtopic } from '../../api/admin';
import type { Subtopic, Topic } from '../../types';

const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' as const },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '12px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1A1A2E' },
  addBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
  },
  filterRow: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
  filterLabel: { fontSize: '13px', fontWeight: 700, color: '#555770' },
  select: { padding: '8px 14px', border: '1.5px solid #E8E8EE', borderRadius: '8px', fontSize: '14px', outline: 'none', minWidth: '200px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  th: { padding: '14px 16px', background: '#F5F7FA', textAlign: 'right' as const, fontWeight: 700, fontSize: '13px', color: '#555770', borderBottom: '2px solid #E8E8EE' },
  td: { padding: '12px 16px', borderBottom: '1px solid #E8E8EE', fontSize: '14px' },
  badge: (published: boolean) => ({
    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
    background: published ? '#E8F5E9' : '#FFF3E0', color: published ? '#2E7D32' : '#E65100',
  }),
  actionBtn: (color: string) => ({
    padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 600, fontSize: '12px', color: '#fff', background: color, marginInlineEnd: '6px',
  }),
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '32px', width: '100%',
    maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto' as const, direction: 'rtl' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalTitle: { fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#1A1A2E' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  formField: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  formFieldFull: { display: 'flex', flexDirection: 'column' as const, gap: '4px', gridColumn: '1 / -1' },
  label: { fontSize: '12px', fontWeight: 700, color: '#555770' },
  input: { padding: '10px 12px', border: '1.5px solid #E8E8EE', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-start' },
  saveBtn: { padding: '10px 28px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '10px 28px', background: '#F5F7FA', color: '#555770', border: '1.5px solid #E8E8EE', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  empty: { padding: '40px', textAlign: 'center' as const, color: '#9E9EAF' },
};

const EMPTY: Partial<Subtopic> = {
  name_he: '', name_en: '', name_ar: '', description: '', topic_id: '', sort_order: 0, is_published: false,
};

export function SubtopicEditorPage() {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Subtopic>>(EMPTY);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminSubtopics(), getAdminTopics().catch(() => [])])
      .then(([subs, t]) => { setSubtopics(subs); setTopics(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filterTopic ? subtopics.filter((s) => s.topic_id === filterTopic) : subtopics;
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name_he || topics.find((t) => t.id === id)?.title || '—';

  const openCreate = () => { setEditing({ ...EMPTY, topic_id: filterTopic || '' }); setModalOpen(true); };
  const openEdit = (sub: Subtopic) => { setEditing({ ...sub }); setModalOpen(true); };
  const close = () => { setModalOpen(false); setEditing(EMPTY); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing.id) {
        await updateSubtopic(editing.id, editing);
      } else {
        await createSubtopic(editing);
      }
      close();
      load();
    } catch (err) {
      alert('שגיאה בשמירה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את תת-הנושא?')) return;
    try {
      await deleteSubtopic(id);
      load();
    } catch (err) {
      alert('שגיאה במחיקה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>📂 ניהול תת-נושאים</h1>
        <button style={s.addBtn} onClick={openCreate}>+ תת-נושא חדש</button>
      </div>

      <div style={s.filterRow}>
        <span style={s.filterLabel}>סינון לפי נושא:</span>
        <select style={s.select} value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
          <option value="">הכל</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name_he || t.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={s.empty}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>אין תת-נושאים. לחץ "+ תת-נושא חדש" להוספה.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>שם (עברית)</th>
              <th style={s.th}>Name (EN)</th>
              <th style={s.th}>נושא</th>
              <th style={s.th}>שיעורים</th>
              <th style={s.th}>סטטוס</th>
              <th style={s.th}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub) => (
              <tr key={sub.id}>
                <td style={s.td}><strong>{sub.name_he || sub.title}</strong></td>
                <td style={s.td}>{sub.name_en || '—'}</td>
                <td style={s.td}>{sub.topic_title || topicName(sub.topic_id)}</td>
                <td style={s.td}>{sub.lesson_count ?? (sub.lessons?.length ?? '—')}</td>
                <td style={s.td}><span style={s.badge(sub.is_published)}>{sub.is_published ? 'פורסם' : 'טיוטה'}</span></td>
                <td style={s.td}>
                  <button style={s.actionBtn('#1565C0')} onClick={() => openEdit(sub)}>✏️ עריכה</button>
                  <button style={s.actionBtn('#d32f2f')} onClick={() => handleDelete(sub.id)}>🗑 מחיקה</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div style={s.overlay} onClick={close}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editing.id ? 'עריכת תת-נושא' : 'תת-נושא חדש'}</h2>
            <form onSubmit={handleSave}>
              <div style={s.formGrid}>
                <div style={s.formFieldFull}>
                  <label style={s.label}>נושא אב</label>
                  <select style={s.input} value={editing.topic_id || ''} onChange={(e) => setEditing({ ...editing, topic_id: e.target.value })} required>
                    <option value="">— בחר נושא —</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name_he || t.title}</option>
                    ))}
                  </select>
                </div>
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
                  <label style={s.label}>סדר מיון</label>
                  <input style={s.input} type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
                <div style={s.formFieldFull}>
                  <label style={s.label}>תיאור</label>
                  <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
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
