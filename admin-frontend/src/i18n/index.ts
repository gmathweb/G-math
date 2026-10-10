import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      overview: 'סקירה כללית',
      topics: 'נושאים',
      subtopics: 'תתי-נושאים',
      lessons: 'שיעורים',
      hero: 'באנרים',
      homeContent: 'תוכן דף הבית',
      files: 'קבצים',
      settings: 'הגדרות',
      login: 'התחברות',
      comingSoon: 'בקרוב...',
      adminPanel: 'פאנל ניהול',
      viewSite: 'צפייה באתר',
    },
  },
  en: {
    translation: {
      overview: 'Overview',
      topics: 'Topics',
      subtopics: 'Subtopics',
      lessons: 'Lessons',
      hero: 'Hero',
      homeContent: 'Home content',
      files: 'Files',
      settings: 'Settings',
      login: 'Login',
      comingSoon: 'Coming soon...',
      adminPanel: 'Admin Panel',
      viewSite: 'View Site',
    },
  },
  ar: {
    translation: {
      overview: 'نظرة عامة',
      topics: 'المواضيع',
      subtopics: 'المواضيع الفرعية',
      lessons: 'الدروس',
      hero: 'البانر',
      homeContent: 'محتوى الصفحة الرئيسية',
      files: 'الملفات',
      settings: 'الإعدادات',
      login: 'تسجيل الدخول',
      comingSoon: 'قريبًا...',
      adminPanel: 'لوحة الإدارة',
      viewSite: 'عرض الموقع',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'he',
  fallbackLng: 'he',
  interpolation: { escapeValue: false },
});

export default i18n;
