import { useEffect, useState, type FormEvent } from 'react';
import { getAdminHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide } from '../../api/admin';
import type { HeroSlide } from '../../types';

const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' as const },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1A1A2E' },
  addBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #E65100, #BF360C)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
  card: {
    background: '#fff', borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: '0.25s',
  },
  preview: {
    height: '140px', display: 'flex', flexDirection: 'column' as const,
    justifyContent: 'center', padding: '24px', color: '#fff',
    background: 'linear-gradient(135deg, #4CAF50 0%, #1565C0 100%)',
  },
  previewTitle: { fontSize: '20px', fontWeight: 800, marginBottom: '6px' },
  previewSubtitle: { fontSize: '14px', opacity: 0.9 },
  previewBtn: {
    display: 'inline-block', marginTop: '10px', padding: '6px 16px',
    background: 'rgba(255,255,255,0.25)', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
  },
  cardBody: { padding: '16px 20px' },
  cardMeta: { fontSize: '12px', color: '#555770', marginBottom: '8px' },
  cardActions: { display: 'flex', gap: '8px', marginTop: '12px' },
  actionBtn: (color: string) => ({
    padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 600, fontSize: '12px', color: '#fff', background: color, flex: 1, textAlign: 'center' as const,
  }),
  moveBtn: {
    padding: '6px 10px', border: '1px solid #E8E8EE', borderRadius: '8px', background: '#F5F7FA',
    cursor: 'pointer', fontSize: '14px',
  },
  badge: (published: boolean) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
    background: published ? '#E8F5E9' : '#FFF3E0', color: published ? '#2E7D32' : '#E65100',
  }),
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '32px', width: '100%',
    maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' as const, direction: 'rtl' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalTitle: { fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#1A1A2E' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' },
  formField: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  formFieldFull: { display: 'flex', flexDirection: 'column' as const, gap: '4px', gridColumn: '1 / -1' },
  sectionLabel: { gridColumn: '1 / -1', fontSize: '14px', fontWeight: 700, color: '#1A1A2E', marginTop: '8px', borderBottom: '1px solid #E8E8EE', paddingBottom: '4px' },
  label: { fontSize: '12px', fontWeight: 700, color: '#555770' },
  input: { padding: '10px 12px', border: '1.5px solid #E8E8EE', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-start' },
  saveBtn: { padding: '10px 28px', background: '#E65100', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '10px 28px', background: '#F5F7FA', color: '#555770', border: '1.5px solid #E8E8EE', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  empty: { padding: '40px', textAlign: 'center' as const, color: '#9E9EAF' },
};

const EMPTY: Partial<HeroSlide> = {
  title_he: '', title_en: '', title_ar: '',
  subtitle_he: '', subtitle_en: '', subtitle_ar: '',
  button_text_he: '', button_text_en: '', button_text_ar: '',
  button_link: '', image_url: '', sort_order: 0, is_published: true,
};

export function HeroEditorPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<HeroSlide>>(EMPTY);

  const load = () => {
    setLoading(true);
    getAdminHeroSlides()
      .then((data) => setSlides(data.sort((a, b) => a.sort_order - b.sort_order)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing({ ...EMPTY, sort_order: slides.length }); setModalOpen(true); };
  const openEdit = (slide: HeroSlide) => { setEditing({ ...slide }); setModalOpen(true); };
  const close = () => { setModalOpen(false); setEditing(EMPTY); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing.id) {
        await updateHeroSlide(editing.id, editing);
      } else {
        await createHeroSlide(editing);
      }
      close();
      load();
    } catch (err) {
      alert('שגיאה בשמירה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את השקופית?')) return;
    try {
      await deleteHeroSlide(id);
      load();
    } catch (err) {
      alert('שגיאה במחיקה: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const move = async (slide: HeroSlide, direction: -1 | 1) => {
    const newOrder = slide.sort_order + direction;
    const other = slides.find((s) => s.sort_order === newOrder);
    try {
      await updateHeroSlide(slide.id, { sort_order: newOrder });
      if (other) await updateHeroSlide(other.id, { sort_order: slide.sort_order });
      load();
    } catch { /* ignore */ }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🎨 ניהול שקופיות ראשיות</h1>
        <button style={s.addBtn} onClick={openCreate}>+ שקופית חדשה</button>
      </div>

      {loading ? (
        <div style={s.empty}>טוען...</div>
      ) : slides.length === 0 ? (
        <div style={s.empty}>אין שקופיות. לחץ "+ שקופית חדשה" להוספה.</div>
      ) : (
        <div style={s.grid}>
          {slides.map((slide, idx) => (
            <div key={slide.id} style={s.card}>
              <div style={s.preview}>
                <div style={s.previewTitle}>{slide.title_he || slide.title_en || 'ללא כותרת'}</div>
                <div style={s.previewSubtitle}>{slide.subtitle_he || slide.subtitle_en || ''}</div>
                {(slide.button_text_he || slide.button_text_en) && (
                  <div style={s.previewBtn}>{slide.button_text_he || slide.button_text_en}</div>
                )}
              </div>
              <div style={s.cardBody}>
                <div style={s.cardMeta}>
                  <span style={s.badge(slide.is_published)}>{slide.is_published ? 'פורסם' : 'טיוטה'}</span>
                  &nbsp;· סדר: {slide.sort_order}
                  {slide.button_link && <span> · קישור: {slide.button_link}</span>}
                </div>
                <div style={s.cardActions}>
                  <button style={s.moveBtn} onClick={() => move(slide, -1)} disabled={idx === 0}>⬆</button>
                  <button style={s.moveBtn} onClick={() => move(slide, 1)} disabled={idx === slides.length - 1}>⬇</button>
                  <button style={s.actionBtn('#1565C0')} onClick={() => openEdit(slide)}>✏️ עריכה</button>
                  <button style={s.actionBtn('#d32f2f')} onClick={() => handleDelete(slide.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={s.overlay} onClick={close}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editing.id ? 'עריכת שקופית' : 'שקופית חדשה'}</h2>
            <form onSubmit={handleSave}>
              <div style={s.formGrid}>
                <div style={s.sectionLabel}>כותרת</div>
                <div style={s.formField}>
                  <label style={s.label}>עברית</label>
                  <input style={s.input} value={editing.title_he || ''} onChange={(e) => setEditing({ ...editing, title_he: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>English</label>
                  <input style={{ ...s.input, direction: 'ltr' }} value={editing.title_en || ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>عربي</label>
                  <input style={s.input} value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} />
                </div>

                <div style={s.sectionLabel}>כותרת משנה</div>
                <div style={s.formField}>
                  <label style={s.label}>עברית</label>
                  <input style={s.input} value={editing.subtitle_he || ''} onChange={(e) => setEditing({ ...editing, subtitle_he: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>English</label>
                  <input style={{ ...s.input, direction: 'ltr' }} value={editing.subtitle_en || ''} onChange={(e) => setEditing({ ...editing, subtitle_en: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>عربي</label>
                  <input style={s.input} value={editing.subtitle_ar || ''} onChange={(e) => setEditing({ ...editing, subtitle_ar: e.target.value })} />
                </div>

                <div style={s.sectionLabel}>טקסט כפתור</div>
                <div style={s.formField}>
                  <label style={s.label}>עברית</label>
                  <input style={s.input} value={editing.button_text_he || ''} onChange={(e) => setEditing({ ...editing, button_text_he: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>English</label>
                  <input style={{ ...s.input, direction: 'ltr' }} value={editing.button_text_en || ''} onChange={(e) => setEditing({ ...editing, button_text_en: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>عربي</label>
                  <input style={s.input} value={editing.button_text_ar || ''} onChange={(e) => setEditing({ ...editing, button_text_ar: e.target.value })} />
                </div>

                <div style={s.sectionLabel}>הגדרות</div>
                <div style={s.formField}>
                  <label style={s.label}>קישור כפתור</label>
                  <input style={{ ...s.input, direction: 'ltr' }} value={editing.button_link || ''} onChange={(e) => setEditing({ ...editing, button_link: e.target.value })} placeholder="/algebra" />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>URL תמונה</label>
                  <input style={{ ...s.input, direction: 'ltr' }} value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>סדר מיון</label>
                  <input style={s.input} type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>
                    <input type="checkbox" checked={editing.is_published ?? true} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
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
