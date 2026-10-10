import { useNavigate } from 'react-router-dom';
import { useOverviewStats, type OverviewStats } from '../api/overview';

/* ── stat card config ───────────────────────────────────────────── */
interface StatCard {
  key: keyof OverviewStats;
  label: string;
  icon: string;
  bg: string;
  text: string;
}

const STAT_CARDS: StatCard[] = [
  { key: 'topics', label: 'נושאים', icon: '📚', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { key: 'subtopics', label: 'נושאי משנה', icon: '📂', bg: 'bg-blue-50', text: 'text-blue-600' },
  { key: 'lessons', label: 'שיעורים', icon: '📖', bg: 'bg-amber-50', text: 'text-amber-600' },
  { key: 'hero_slides', label: 'באנרים', icon: '🖼️', bg: 'bg-purple-50', text: 'text-purple-600' },
  { key: 'files', label: 'קבצים', icon: '📄', bg: 'bg-rose-50', text: 'text-rose-600' },
];

/* ── recent activity (static sample — will be replaced by API) ── */
const RECENT_ACTIVITY = [
  { icon: '✏️', text: 'עדכון נושא אלגברה', time: 'לפני 10 דקות' },
  { icon: '📤', text: 'העלאת מצגת — חשבון דיפרנציאלי', time: 'לפני 25 דקות' },
  { icon: '🖼️', text: 'שינוי באנר ראשי', time: 'לפני שעה' },
  { icon: '📝', text: 'יצירת שיעור חדש — גיאומטריה', time: 'לפני שעתיים' },
  { icon: '🗑️', text: 'מחיקת קובץ ישן', time: 'אתמול' },
];

/* ── shortcut buttons ───────────────────────────────────────────── */
const SHORTCUTS = [
  { label: '+ נושא חדש', to: '/admin/topics', color: 'bg-[var(--g-green)]' },
  { label: '+ נושא משנה', to: '/admin/subtopics', color: 'bg-[var(--g-blue)]' },
  { label: '+ שיעור חדש', to: '/admin/lessons', color: 'bg-[var(--g-green)]' },
  { label: '✏️ עריכת באנר', to: '/admin/hero', color: 'bg-[var(--g-blue)]' },
];

/* ── skeleton pulse block ───────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

/* ================================================================ */
export default function OverviewPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOverviewStats();

  return (
    <div className="space-y-6">
      {/* ── page title ───────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold">סקירה כללית</h1>

      {/* ── stats cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="group bg-white rounded-xl border border-[var(--bd)] p-5 flex flex-col items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-lg cursor-default"
          >
            <span
              className={`${card.bg} ${card.text} w-12 h-12 flex items-center justify-center rounded-full text-2xl`}
            >
              {card.icon}
            </span>

            {isLoading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <span className="text-3xl font-bold text-[var(--tp)]">
                {stats?.[card.key] ?? 0}
              </span>
            )}

            <span className="text-sm text-[var(--ts)]">{card.label}</span>
          </div>
        ))}
      </div>

      {/* ── two-column grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* left: recent activity */}
        <div className="bg-white rounded-xl border border-[var(--bd)] p-5">
          <h2 className="text-lg font-semibold mb-4">פעילות אחרונה</h2>

          <ul className="divide-y divide-[var(--bd)]">
            {RECENT_ACTIVITY.map((item, i) => (
              <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg2)] text-lg shrink-0">
                  {item.icon}
                </span>
                <span className="flex-1 text-sm text-[var(--tp)]">{item.text}</span>
                <span className="text-xs text-[var(--ts)] whitespace-nowrap">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* right: quick shortcuts */}
        <div className="bg-white rounded-xl border border-[var(--bd)] p-5">
          <h2 className="text-lg font-semibold mb-4">קיצורי דרך</h2>

          <div className="grid grid-cols-2 gap-3">
            {SHORTCUTS.map((s) => (
              <button
                key={s.to}
                type="button"
                onClick={() => navigate(s.to)}
                className={`${s.color} text-white rounded-lg py-4 text-sm font-semibold transition-all hover:opacity-90 hover:shadow-md`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
