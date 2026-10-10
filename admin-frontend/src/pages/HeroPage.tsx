import { useState } from 'react';
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide } from '../api/hero';
import ModalForm from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import type { HeroSlide } from '../types';

export default function HeroPage() {
  const { data: slides = [], isLoading } = useHeroSlides();
  const createSlide = useCreateHeroSlide();
  const updateSlide = useUpdateHeroSlide();
  const deleteSlide = useDeleteHeroSlide();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Inline-edit local state (keyed by slide id)
  const [edits, setEdits] = useState<Record<string, Partial<HeroSlide>>>({});

  const getEditValue = (slide: HeroSlide, field: keyof HeroSlide) => {
    return edits[slide.id]?.[field] ?? slide[field];
  };

  const setEditValue = (id: string, field: keyof HeroSlide, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (slide: HeroSlide) => {
    const patch = edits[slide.id];
    if (!patch) return;
    await updateSlide.mutateAsync({ id: slide.id, ...patch });
    setEdits((prev) => {
      const next = { ...prev };
      delete next[slide.id];
      return next;
    });
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const hasChanges = (id: string) => {
    const e = edits[id];
    return e && Object.keys(e).length > 0;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">שקופיות ראשיות</h1>
          <Badge label={`${slides.length} שקופיות`} icon="🎠" />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 rounded transition-colors"
        >
          + הוסף שקופית
        </button>
      </div>

      {/* Slide Editor Cards */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[var(--bd)] rounded-lg p-6 animate-pulse">
              <div className="h-5 w-1/3 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-2/3 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--ts)]">
          <span className="text-5xl mb-3">🎠</span>
          <span className="text-lg">אין שקופיות עדיין</span>
          <span className="text-sm">הוסף שקופית ראשונה כדי להתחיל</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="bg-white border border-[var(--bd)] rounded-lg p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Slide number + fields */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={`שקופית ${idx + 1}`} icon="📌" color="#6366f1" bgColor="#e0e7ff" />
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`hero-title-${slide.id}`} className="text-xs font-medium text-[var(--ts)]">כותרת</label>
                    <input
                      id={`hero-title-${slide.id}`}
                      type="text"
                      value={String(getEditValue(slide, 'title'))}
                      onChange={(e) => setEditValue(slide.id, 'title', e.target.value)}
                      className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
                      placeholder="כותרת השקופית"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`hero-subtitle-${slide.id}`} className="text-xs font-medium text-[var(--ts)]">תת-כותרת</label>
                    <input
                      id={`hero-subtitle-${slide.id}`}
                      type="text"
                      value={String(getEditValue(slide, 'subtitle'))}
                      onChange={(e) => setEditValue(slide.id, 'subtitle', e.target.value)}
                      className="w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
                      placeholder="תת-כותרת"
                    />
                  </div>

                  {/* Button text */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`hero-btn-${slide.id}`} className="text-xs font-medium text-[var(--ts)]">טקסט כפתור</label>
                    <input
                      id={`hero-btn-${slide.id}`}
                      type="text"
                      value={String(getEditValue(slide, 'button_text'))}
                      onChange={(e) => setEditValue(slide.id, 'button_text', e.target.value)}
                      className="w-full max-w-xs border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
                      placeholder="טקסט הכפתור"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 sm:pt-6">
                  <button
                    onClick={() => handleSave(slide)}
                    disabled={!hasChanges(slide.id)}
                    className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded hover:bg-green-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="שמור"
                    aria-label="שמור"
                  >
                    💾
                  </button>
                  <button
                    onClick={() => openDelete(slide.id)}
                    className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded hover:bg-red-50 transition-colors"
                    title="מחק"
                    aria-label="מחק"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Preview */}
      {slides.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-[var(--tp)]">תצוגה מקדימה</h2>
          <div className="bg-gradient-to-l from-[var(--g-green)] to-[var(--g-blue)] rounded-xl overflow-hidden">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`p-8 text-white text-center ${idx > 0 ? 'border-t border-white/20' : ''}`}
              >
                <div className="text-xs text-white/60 mb-2">שקופית {idx + 1}</div>
                <h3 className="text-2xl font-bold mb-2">
                  {String(getEditValue(slide, 'title')) || 'ללא כותרת'}
                </h3>
                <p className="text-sm text-white/80 mb-4">
                  {String(getEditValue(slide, 'subtitle')) || 'ללא תת-כותרת'}
                </p>
                <span className="inline-block bg-white text-[var(--g-green)] px-6 py-2 rounded-full text-sm font-semibold">
                  {String(getEditValue(slide, 'button_text')) || 'כפתור'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <ModalForm
        open={createOpen}
        title="הוסף שקופית חדשה"
        fields={[
          { name: 'title', label: 'כותרת', type: 'text', required: true, placeholder: 'כותרת השקופית' },
          { name: 'subtitle', label: 'תת-כותרת', type: 'text', placeholder: 'תת-כותרת' },
          { name: 'button_text', label: 'טקסט כפתור', type: 'text', required: true, placeholder: 'טקסט הכפתור' },
        ]}
        submitLabel="הוסף"
        onSubmit={async (data) => {
          await createSlide.mutateAsync(data as unknown as Partial<HeroSlide>);
          setCreateOpen(false);
        }}
        onClose={() => setCreateOpen(false)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="מחיקת שקופית"
        message="האם אתה בטוח שברצונך למחוק שקופית זו?"
        confirmLabel="מחק"
        variant="danger"
        onConfirm={async () => {
          if (deleteId) await deleteSlide.mutateAsync(deleteId);
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onCancel={() => { setDeleteOpen(false); setDeleteId(null); }}
      />
    </div>
  );
}
