import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapTrifold } from '@phosphor-icons/react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent flex items-center justify-center">
                <MapTrifold className="w-6 h-6 text-accent-foreground" weight="duotone" />
              </div>
              <span className="font-black text-lg tracking-tight">
                Guinea Land Hub
              </span>
            </Link>
            <p className="text-primary-foreground/80 text-sm max-w-md">
              La plateforme de référence pour les transactions foncières en Guinée. 
              Transparence, sécurité et accessibilité pour tous.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/map" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {t('nav.map')}
                </Link>
              </li>
              <li>
                <Link to="/listings" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {t('nav.listings')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {t('nav.login')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/feedback" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Suggestions & Feedback
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <p className="text-center text-sm text-primary-foreground/60">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
