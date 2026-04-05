import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { NotificationBell } from './Notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  MapTrifold, 
  House, 
  ChartBar, 
  Receipt, 
  User, 
  SignOut, 
  List,
  Globe,
  CaretDown,
  ShieldCheck
} from '@phosphor-icons/react';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = user ? [
    { path: '/map', label: t('nav.map'), icon: MapTrifold },
    { path: '/listings', label: t('nav.listings'), icon: House },
    { path: '/dashboard', label: t('nav.dashboard'), icon: ChartBar },
    { path: '/transactions', label: t('nav.transactions'), icon: Receipt },
    ...(user.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ] : [
    { path: '/map', label: t('nav.map'), icon: MapTrifold },
    { path: '/listings', label: t('nav.listings'), icon: House },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <MapTrifold className="w-6 h-6 text-primary-foreground" weight="duotone" />
              </div>
              <span className="font-black text-lg tracking-tight hidden sm:block">
                Guinea Land Hub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'text-primary bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="w-4 h-4" weight={isActive(path) ? 'fill' : 'regular'} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline uppercase">{i18n.language}</span>
                  <CaretDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                  {t('settings.language.fr')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  {t('settings.language.en')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <User className="w-5 h-5" weight="fill" />
                    )}
                    <span className="hidden sm:inline">{user.name}</span>
                    <CaretDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <SignOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button size="sm" className="shadow-brutal-sm btn-hover-lift" asChild>
                  <Link to="/register">{t('nav.register')}</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'text-primary bg-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-5 h-5" weight={isActive(path) ? 'fill' : 'regular'} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
