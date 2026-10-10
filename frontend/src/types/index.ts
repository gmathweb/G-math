export type Locale = 'he' | 'en' | 'ar';

// ── Public API response types (localized by server) ──

export interface PublicTopic {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bg_color: string;
  sort_order: number;
  subtopic_count: number;
  lesson_count: number;
}

export interface PublicSubtopic {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  lessons: PublicLessonSummary[];
}

export interface PublicLessonSummary {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface PublicTopicDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bg_color: string;
  sort_order: number;
  subtopics: PublicSubtopic[];
}

export interface PublicContentFile {
  id: string;
  file_type: 'presentation' | 'worksheet' | 'geogebra' | 'video';
  file_url: string;
  display_name: string;
  sort_order: number;
}

export interface PublicLessonDetail {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  subtopic_slug: string;
  topic_slug: string;
  subtopic_name?: string;
  topic_name?: string;
  content_files: PublicContentFile[];
}

export interface PublicHeroSlide {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  sort_order: number;
}

export interface PublicTrustCard {
  icon: string;
  text: string;
}

export interface PublicAboutContent {
  title: string;
  body: string;
  button_text: string;
  button_link: string;
}

export interface PublicSiteContent {
  trust_cards: PublicTrustCard[];
  about: PublicAboutContent;
}

// ── Admin types (multilingual, full CRUD) ──

export interface Topic {
  id: string;
  slug: string;
  title: string;
  name_he?: string;
  name_en?: string;
  name_ar?: string;
  description?: string;
  icon?: string;
  color?: string;
  bg_color?: string;
  sort_order: number;
  is_published: boolean;
  subtopic_count?: number;
  lesson_count?: number;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  id: string;
  slug: string;
  title: string;
  name_he?: string;
  name_en?: string;
  name_ar?: string;
  description?: string;
  topic_id: string;
  topic_title?: string;
  sort_order: number;
  is_published: boolean;
  lesson_count?: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  name_he?: string;
  name_en?: string;
  name_ar?: string;
  description?: string;
  subtopic_id: string;
  topic_id?: string;
  subtopic_title?: string;
  topic_title?: string;
  sort_order: number;
  is_published: boolean;
  available_locales: Locale[];
  presentation?: ContentFile;
  working_page?: ContentFile;
  geogebra_activities?: GeoGebraActivity[];
}

export interface ContentFile {
  url: string;
  version: number;
}

export interface GeoGebraActivity {
  id: string;
  material_id?: string;
  custom_file_path?: string;
  applet_params: Record<string, unknown>;
  sort_order: number;
}

export interface HeroSlide {
  id: string;
  title_he?: string;
  title_en?: string;
  title_ar?: string;
  subtitle_he?: string;
  subtitle_en?: string;
  subtitle_ar?: string;
  button_text_he?: string;
  button_text_en?: string;
  button_text_ar?: string;
  button_link?: string;
  image_url?: string;
  sort_order: number;
  is_published: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface AdminStats {
  topics: number;
  subtopics: number;
  lessons: number;
  hero_slides: number;
}
