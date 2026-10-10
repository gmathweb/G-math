import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="hdr">
      <Link to="/" className="logo">
        <span className="logo-mark" dir="ltr">
          <span className="lg">G</span>
          <span className="lm">Math</span>
        </span>
        <span className="lt">{t('tagline')}</span>
      </Link>
    </header>
  );
}
