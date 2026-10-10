import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDirection } from './hooks/useDirection';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/student/HomePage';
import { TopicPage } from './pages/student/TopicPage';
import { LessonPage } from './pages/student/LessonPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { TopicEditorPage } from './pages/admin/TopicEditorPage';
import { SubtopicEditorPage } from './pages/admin/SubtopicEditorPage';
import { LessonEditorPage } from './pages/admin/LessonEditorPage';
import { HeroEditorPage } from './pages/admin/HeroEditorPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

function AppContent() {
  useDirection();

  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Student routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/:topicSlug" element={<TopicPage />} />
        <Route path="/:topicSlug/:subtopicSlug" element={<TopicPage />} />
        <Route path="/:topicSlug/:subtopicSlug/:lessonSlug" element={<LessonPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/topics" element={<TopicEditorPage />} />
        <Route path="/admin/subtopics" element={<SubtopicEditorPage />} />
        <Route path="/admin/lessons" element={<LessonEditorPage />} />
        <Route path="/admin/hero" element={<HeroEditorPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
