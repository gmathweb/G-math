import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminTopics, getAdminSubtopics, getAdminLessons, getAdminHeroSlides } from '../../api/admin';
import type { AdminStats } from '../../types';

const s = {
  page: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    direction: 'rtl' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1A1A2E',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px 24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: '0.25s',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  cardIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  cardCount: {
    fontSize: '36px',
    fontWeight: 800,
    marginBottom: '4px',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#555770',
  },
  section: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#1A1A2E',
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    borderRadius: '12px',
    background: '#F5F7FA',
    color: '#1A1A2E',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
    transition: '0.25s',
    border: '1.5px solid #E8E8EE',
  },
  placeholder: {
    color: '#9E9EAF',
    fontSize: '14px',
    padding: '20px 0',
  },
};

const statCards = [
  { key: 'topics' as const, label: 'נושאים', icon: '📚', color: '#4CAF50', link: '/admin/topics' },
  { key: 'subtopics' as const, label: 'תת-נושאים', icon: '📂', color: '#1565C0', link: '/admin/subtopics' },
  { key: 'lessons' as const, label: 'שיעורים', icon: '📝', color: '#7B1FA2', link: '/admin/lessons' },
  { key: 'hero_slides' as const, label: 'שקופיות ראשיות', icon: '🎨', color: '#E65100', link: '/admin/hero' },
];

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats>({ topics: 0, subtopics: 0, lessons: 0, hero_slides: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminTopics().catch(() => []),
      getAdminSubtopics().catch(() => []),
      getAdminLessons().catch(() => []),
      getAdminHeroSlides().catch(() => []),
    ]).then(([topics, subtopics, lessons, slides]) => {
      setStats({
        topics: topics.length,
        subtopics: subtopics.length,
        lessons: lessons.length,
        hero_slides: slides.length,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>לוח בקרה — G-Math CMS</h1>
      </div>

      <div style={s.grid}>
        {statCards.map((c) => (
          <Link key={c.key} to={c.link} style={s.card}>
            <div style={s.cardIcon}>{c.icon}</div>
            <div style={{ ...s.cardCount, color: c.color }}>
              {loading ? '...' : stats[c.key]}
            </div>
            <div style={s.cardLabel}>{c.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={s.section}>
          <h3 style={s.sectionTitle}>ניווט מהיר</h3>
          <div style={s.navGrid}>
            <Link to="/admin/topics" style={s.navLink}>📚 ניהול נושאים</Link>
            <Link to="/admin/subtopics" style={s.navLink}>📂 ניהול תת-נושאים</Link>
            <Link to="/admin/lessons" style={s.navLink}>📝 ניהול שיעורים</Link>
            <Link to="/admin/hero" style={s.navLink}>🎨 שקופיות ראשיות</Link>
          </div>
        </div>

        <div style={s.section}>
          <h3 style={s.sectionTitle}>פעילות אחרונה</h3>
          <div style={s.placeholder}>
            פעילות אחרונה תוצג כאן בקרוב...
          </div>
        </div>
      </div>
    </div>
  );
}

