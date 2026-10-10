import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: number;
  end?: boolean;
}

export interface SidebarProps {
  items: NavItem[];
  siteUrl?: string;
}

export default function Sidebar({ items, siteUrl }: SidebarProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <>
      {/* Mobile hamburger — visible only on small screens */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="fixed top-3 start-3 z-40 flex h-11 w-11 items-center justify-center rounded bg-white shadow md:hidden"
        aria-label={collapsed ? 'פתח תפריט' : 'סגור תפריט'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* Backdrop on mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 start-0 z-30 h-full w-56 shrink-0 bg-white border-e border-[var(--bd)] flex flex-col transition-transform md:static md:translate-x-0 ${
          collapsed ? '-translate-x-full rtl:translate-x-full' : ''
        }`}
      >
        {/* Brand */}
        <div className="h-14 flex items-center justify-center border-b border-[var(--bd)] font-bold text-lg text-[var(--g-green)]">
          G-math&nbsp;{t('adminPanel')}
        </div>

        {/* Nav */}
        <nav aria-label="ניווט ראשי" className="flex-1 py-2 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setCollapsed(true)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--g-green)]/10 text-[var(--g-green)] font-semibold'
                    : 'text-[var(--ts)] hover:bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="flex-1">{t(item.label)}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-[var(--g-green)]/15 text-[var(--g-green)] text-xs font-semibold px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {siteUrl && (
          <div className="border-t border-[var(--bd)] p-3">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded px-3 py-2 text-sm text-[var(--g-blue)] hover:bg-[var(--g-blue)]/5 transition-colors"
            >
              <span>🌐</span>
              <span>{t('viewSite') || 'צפייה באתר'}</span>
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
