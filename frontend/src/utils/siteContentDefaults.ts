import type { TFunction } from 'i18next';
import type { PublicSiteContent } from '../types';

export const DEFAULT_ABOUT_LINK = '/about-mathematics';

export function fallbackSiteContent(t: TFunction): PublicSiteContent {
  return {
    trust_cards: [
      { icon: '🏛️', text: t('tree.trust1') },
      { icon: '🎁', text: t('tree.trust2') },
      { icon: '📚', text: t('tree.trust3') },
    ],
    about: {
      title: t('tree.aboutTitle'),
      body: t('tree.aboutBody'),
      button_text: t('tree.aboutButton'),
      button_link: DEFAULT_ABOUT_LINK,
    },
  };
}
