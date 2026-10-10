import { useEffect, useState, type FormEvent } from 'react';
import { getAdminLessons, getAdminTopics, getAdminSubtopics, createLesson, updateLesson, deleteLesson } from '../../api/admin';
import type { Lesson, Topic, Subtopic } from '../../types';

const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' as const },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '12px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1A1A2E' },
  addBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #7B1FA2, #4A148C)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
  },
  filterRow: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' as const },
  filterLabel: { fontSize: '13px', fontWeight: 700, color: '#555770' },
  select: { padding: '8px 14px', border: '1.5px solid #E8E8EE', borderRadius: '8px', fontSize: '14px', outline: 'none', minWidth: '200px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  th: { padding: '14px 16px', background: '#F5F7FA', textAlign: 'right' as const, fontWeight: 700, fontSize: '13px', color: '#555770', borderBottom: '2px solid #E8E8EE' },
  td: { padding: '12px 16px', borderBottom: '1px solid #E8E8EE', fontSize: '14px' },
  badge: (published: boolean) => ({
    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
    background: published ? '#E8F5E9' : '#FFF3E0', color: published ? '#2E7D32' : '#E65100',
  }),
  localeBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '8px', fontSize: '11px',
    fontWeight: 700, background: '#E3F2FD', color: '#1565C0', marginInlineEnd: '4px',
  },
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
  saveBtn: { padding: '10px 28px', background: '#7B1FA2', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '10px 28px', background: '#F5F7FA', color: '#555770', border: '1.5px solid #E8E8EE', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  empty: { padding: '40px', textAlign: 'center' as const, color: '#9E9EAF' },
};

const EMPTY: Partial<Lesson> = {
  name_he: '', name_en: '', name_ar: '', description: '', subtopic_id: '',
  sort_order: 0, is_published: false, available_locales: [],
};

export function LessonEditorPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterSubtopic, setFilterSubtopic] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Lesson>>(EMPTY);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminLessons(), getAdminTopics().catch(() => []), getAdminSubtopics().catch(() => [])])
      .then(([l, t, sub]) => { setLessons(l); setTopics(t); setSubtopics(sub); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredSubtopics = filterTopic
    ? subtopics.filter((st) => st.topic_id === filterTopic)
    : subtopics;

  const filtered = lessons.filter((l) => {
    if (filterSubtopic && l.subtopic_id !== filterSubtopic) return false;
    if (filterTopic && !filterSubtopic) {
      const subIds = new Set(filteredSubtopics.map((st) => st.id));
      if (!subIds.has(l.subtopic_id)) return false;
    }
    return true;
  });

  const subtopicName = (id: string) => subtopics.find((st) => st.id === id)?.name_he || subtopics.find((st) => st.id === id)?.title || '—';

  const openCreate = () => { setEditing({ ...EMPTY, subtopic_id: filterSubtopic || '' }); setModalOpen(true); };
  const openEdit = (l: Lesson) => { setEditing({ ...l }); setModalOpen(true); };
  const close = () => { setModalOpen(false); setEditing(EMPTY); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing.id) {
        await updateLesson(editing.id, editing);
      } else {
        await createLesson(editing);
      }
      close();
      load();
    } catch (err) {
      alert('שגיאה בשמירה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את השיעור?')) return;
    try {
      await deleteLesson(id);
      load();
    } catch (err) {
      alert('שגיאה במחיקה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>📝 ניהול שיעורים</h1>
        <button style={s.addBtn} onClick={openCreate}>+ שיעור חדש</button>
      </div>

      <div style={s.filterRow}>
        <span style={s.filterLabel}>נושא:</span>
        <select style={s.select} value={filterTopic} onChange={(e) => { setFilterTopic(e.target.value); setFilterSubtopic(''); }}>
          <option value="">הכל</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name_he || t.title}</option>
          ))}
        </select>
        <span style={s.filterLabel}>תת-נושא:</span>
        <select style={s.select} value={filterSubtopic} onChange={(e) => setFilterSubtopic(e.target.value)}>
          <option value="">הכל</option>
          {filteredSubtopics.map((st) => (
            <option key={st.id} value={st.id}>{st.name_he || st.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={s.empty}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>אין שיעורים. לחץ "+ שיעור חדש" להוספה.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>שם (עברית)</th>
              <th style={s.th}>Name (EN)</th>
              <th style={s.th}>תת-נושא</th>
              <th style={s.th}>שפות</th>
              <th style={s.th}>סטטוס</th>
              <th style={s.th}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td style={s.td}><strong>{l.name_he || l.title}</strong></td>
                <td style={s.td}>{l.name_en || '—'}</td>
                <td style={s.td}>{l.subtopic_title || subtopicName(l.subtopic_id)}</td>
                <td style={s.td}>
                  {(l.available_locales || []).map((loc) => (
                    <span key={loc} style={s.localeBadge}>{loc}</span>
                  ))}
                  {(!l.available_locales || l.available_locales.length === 0) && '—'}
                </td>
                <td style={s.td}><span style={s.badge(l.is_published)}>{l.is_published ? 'פורסם' : 'טיוטה'}</span></td>
                <td style={s.td}>
                  <button style={s.actionBtn('#1565C0')} onClick={() => openEdit(l)}>✏️ עריכה</button>
                  <button style={s.actionBtn('#d32f2f')} onClick={() => handleDelete(l.id)}>🗑 מחיקה</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div style={s.overlay} onClick={close}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editing.id ? 'עריכת שיעור' : 'שיעור חדש'}</h2>
            <form onSubmit={handleSave}>
              <div style={s.formGrid}>
                <div style={s.formFieldFull}>
                  <label style={s.label}>תת-נושא</label>
                  <select style={s.input} value={editing.subtopic_id || ''} onChange={(e) => setEditing({ ...editing, subtopic_id: e.target.value })} required>
                    <option value="">— בחר תת-נושא —</option>
                    {subtopics.map((st) => (
                      <option key={st.id} value={st.id}>{st.name_he || st.title}</option>
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
