import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import type { NavItem } from '../components/Sidebar';

const navItems: NavItem[] = [
  { to: '/admin', label: 'overview', icon: '📊', end: true },
  { to: '/admin/topics', label: 'topics', icon: '📚' },
  { to: '/admin/subtopics', label: 'subtopics', icon: '📂' },
  { to: '/admin/lessons', label: 'lessons', icon: '📝' },
  { to: '/admin/hero', label: 'hero', icon: '🖼️' },
  { to: '/admin/home-content', label: 'homeContent', icon: '🏠' },
  { to: '/admin/files', label: 'files', icon: '📁' },
  { to: '/admin/settings', label: 'settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  const currentPage =
    navItems.find((item) =>
      item.to === '/admin'
        ? location.pathname === '/admin'
        : location.pathname.startsWith(item.to),
    )?.label ?? 'overview';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded focus:bg-[var(--g-green)] focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-semibold"
      >
        דלג לתוכן הראשי
      </a>
      <div className="flex min-h-screen">
        <Sidebar items={navItems} siteUrl="/" />

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="h-14 bg-white border-b border-[var(--bd)] flex items-center pe-6 ps-14 md:ps-6 sticky top-0 z-10">
            <span className="text-sm text-[var(--ts)]">{t(currentPage)}</span>
          </header>

          {/* Content */}
          <main id="main-content" className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
