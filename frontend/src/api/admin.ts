import { apiClient } from './client';
import { getStoredToken } from '../hooks/useAuth';
import type { Topic, Subtopic, Lesson, HeroSlide, LoginResponse } from '../types';

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
}

// Auth
export function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Topics
export const getAdminTopics = () => adminFetch<Topic[]>('/admin/topics');
export const createTopic = (data: Partial<Topic>) =>
  adminFetch<Topic>('/admin/topics', { method: 'POST', body: JSON.stringify(data) });
export const updateTopic = (id: string, data: Partial<Topic>) =>
  adminFetch<Topic>(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTopic = (id: string) =>
  adminFetch<void>(`/admin/topics/${id}`, { method: 'DELETE' });

// Subtopics
export const getAdminSubtopics = () => adminFetch<Subtopic[]>('/admin/subtopics');
export const createSubtopic = (data: Partial<Subtopic>) =>
  adminFetch<Subtopic>('/admin/subtopics', { method: 'POST', body: JSON.stringify(data) });
export const updateSubtopic = (id: string, data: Partial<Subtopic>) =>
  adminFetch<Subtopic>(`/admin/subtopics/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubtopic = (id: string) =>
  adminFetch<void>(`/admin/subtopics/${id}`, { method: 'DELETE' });

// Lessons
export const getAdminLessons = () => adminFetch<Lesson[]>('/admin/lessons');
export const createLesson = (data: Partial<Lesson>) =>
  adminFetch<Lesson>('/admin/lessons', { method: 'POST', body: JSON.stringify(data) });
export const updateLesson = (id: string, data: Partial<Lesson>) =>
  adminFetch<Lesson>(`/admin/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteLesson = (id: string) =>
  adminFetch<void>(`/admin/lessons/${id}`, { method: 'DELETE' });

// Hero Slides
export const getAdminHeroSlides = () => adminFetch<HeroSlide[]>('/admin/hero-slides');
export const createHeroSlide = (data: Partial<HeroSlide>) =>
  adminFetch<HeroSlide>('/admin/hero-slides', { method: 'POST', body: JSON.stringify(data) });
export const updateHeroSlide = (id: string, data: Partial<HeroSlide>) =>
  adminFetch<HeroSlide>(`/admin/hero-slides/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteHeroSlide = (id: string) =>
  adminFetch<void>(`/admin/hero-slides/${id}`, { method: 'DELETE' });

