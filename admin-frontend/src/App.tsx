import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './i18n';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import OverviewPage from './pages/OverviewPage';
import TopicsPage from './pages/TopicsPage';
import SubtopicsPage from './pages/SubtopicsPage';
import LessonsPage from './pages/LessonsPage';
import HeroPage from './pages/HeroPage';
import HomeContentPage from './pages/HomeContentPage';
import FilesPage from './pages/FilesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="topics" element={<TopicsPage />} />
              <Route path="subtopics" element={<SubtopicsPage />} />
              <Route path="lessons" element={<LessonsPage />} />
              <Route path="hero" element={<HeroPage />} />
              <Route path="home-content" element={<HomeContentPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-center" dir="rtl" />
    </QueryClientProvider>
  );
}
