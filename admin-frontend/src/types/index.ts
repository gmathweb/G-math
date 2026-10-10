export interface LocalizedText {
  he: string;
  en: string;
  ar: string;
}

export interface Topic {
  id: string;
  icon: string;
  color: string;
  bg_color: string;
  name: LocalizedText;
  description: LocalizedText;
  subtopic_count: number;
  lesson_count: number;
  sort_order: number;
  status: 'published' | 'draft';
}

export interface Subtopic {
  id: string;
  icon: string;
  name: LocalizedText;
  topic_id: string;
  topic_name: string;
  lesson_count: number;
  sort_order: number;
  status: 'published' | 'draft';
}

export interface Lesson {
  id: string;
  name: LocalizedText;
  subtopic_id: string;
  subtopic_name: string;
  topic_id: string;
  topic_name: string;
  file_count: number;
  status: 'published' | 'draft';
}

export interface HeroSlide {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  button_text: string;
}

export interface UploadedFile {
  id: string;
  lesson_id: string;
  file_url: string;
  file_type: 'presentation' | 'worksheet' | 'geogebra' | 'video';
  display_name: string;
  sort_order: number;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  active_languages: string[];
}

export interface DesignSettings {
  primary_color: string;
  secondary_color: string;
  logo_url: string;
}

export interface AppSettings {
  site: SiteSettings;
  design: DesignSettings;
}
