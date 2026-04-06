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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { 
  MapTrifold, 
  House, 
  ChartLine, 
  Receipt, 
  User, 
  SignOut, 
  List,
  Globe,
  CaretDown,
  CaretRight,
  ShieldCheck,
  BellRinging,
  MagnifyingGlass,
  Scales,
  TrendUp,
  Heart,
  ChatCircle,
  Users,
  Plus,
  Folder,
  QrCode,
  WhatsappLogo,
  Gear,
  Question,
  X
} from '@phosphor-icons/react';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Main navigation links
  const mainNavLinks = [
    { path: '/map', label: t('nav.map'), icon: MapTrifold },
    { path: '/listings', label: t('nav.listings'), icon: House },
  ];

  // Mega menu categories
  const megaMenuItems = {
    discover: {
      title: 'Découvrir',
      items: [
        { path: '/map', label: 'Carte interactive', icon: MapTrifold, desc: 'Explorer les terrains sur la carte' },
        { path: '/listings', label: 'Tous les terrains', icon: House, desc: 'Parcourir les annonces' },
        { path: '/market-trends', label: 'Tendances du marché', icon: TrendUp, desc: 'Analyser les prix et tendances' },
      ]
    },
    compare: {
      title: 'Comparer & Analyser',
      items: [
        { path: '/compare', label: 'Comparer les terrains', icon: Scales, desc: 'Comparer jusqu\'à 4 terrains' },
        { path: '/market-trends', label: 'Évolution des prix', icon: ChartLine, desc: 'Historique des transactions' },
      ]
    },
    alerts: {
      title: 'Alertes & Recherches',
      items: [
        { path: '/zone-alerts', label: 'Alertes de zone', icon: BellRinging, desc: 'Notifications par zone' },
        { path: '/saved-searches', label: 'Recherches sauvegardées', icon: MagnifyingGlass, desc: 'Vos critères enregistrés' },
      ]
    },
    community: {
      title: 'Communauté',
      items: [
        { path: '/market-trends', label: 'Top Vendeurs', icon: Users, desc: 'Vendeurs les mieux notés', hash: '#sellers' },
        { path: '/market-trends', label: 'Officiels vérifiés', icon: ShieldCheck, desc: 'Contacts de confiance', hash: '#officials' },
        { path: '/feedback', label: 'Suggestions', icon: ChatCircle, desc: 'Partagez vos idées' },
      ]
    },
  };

  // User menu items
  const userMenuItems = user ? [
    { path: '/dashboard', label: 'Tableau de bord', icon: ChartLine },
    { path: '/lands/new', label: 'Ajouter un terrain', icon: Plus },
    { path: '/transactions', label: 'Mes transactions', icon: Receipt },
    { path: '/profile', label: 'Mon profil', icon: User },
    { path: '/zone-alerts', label: 'Alertes de zone', icon: BellRinging },
    { path: '/saved-searches', label: 'Recherches', icon: Folder },
    ...(user.role === 'admin' ? [{ path: '/admin', label: 'Administration', icon: ShieldCheck }] : []),
  ] : [];

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
            {/* Main Links */}
            {mainNavLinks.map(({ path, label, icon: Icon }) => (
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

            {/* Mega Menu Trigger */}
            <div 
              className="relative"
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  showMegaMenu
                    ? 'text-primary bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <TrendUp className="w-4 h-4" />
                Outils
                <CaretDown className={`w-3 h-3 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown */}
              {showMegaMenu && (
                <div className="absolute top-full left-0 mt-0 w-[600px] bg-card border border-border shadow-lg rounded-b-lg -translate-x-1/4">
                  <div className="grid grid-cols-2 gap-0 p-4">
                    {Object.entries(megaMenuItems).map(([key, category]) => (
                      <div key={key} className="p-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          {category.title}
                        </h4>
                        <div className="space-y-1">
                          {category.items.map((item) => (
                            <Link
                              key={item.path + (item.hash || '')}
                              to={item.path + (item.hash || '')}
                              onClick={() => setShowMegaMenu(false)}
                              className="flex items-start gap-3 p-2 rounded hover:bg-secondary/50 transition-colors group"
                            >
                              <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                              <div>
                                <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                  {item.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.desc}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="border-t border-border p-3 bg-secondary/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <QrCode className="w-4 h-4" />
                      <span>Scannez un QR code pour accéder à un terrain</span>
                    </div>
                    {user && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/lands/new" className="gap-1">
                          <Plus className="w-4 h-4" />
                          Ajouter terrain
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Compare Link */}
            <Link
              to="/compare"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive('/compare')
                  ? 'text-primary bg-secondary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Scales className="w-4 h-4" weight={isActive('/compare') ? 'fill' : 'regular'} />
              Comparer
            </Link>
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
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeLanguage('pu')}>
                  𞤆𞤵𞤤𞤢𞤪 (Pular)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ma')}>
                  Maninka
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('su')}>
                  Susu
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
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                    <CaretDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 border-b border-border mb-1">
                    <div className="font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
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
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <List className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2">
                    <MapTrifold className="w-5 h-5 text-primary" weight="fill" />
                    Guinea Land Hub
                  </SheetTitle>
                </SheetHeader>
                
                <div className="overflow-y-auto h-[calc(100vh-80px)]">
                  {/* User Info (if logged in) */}
                  {user && (
                    <div className="p-4 border-b border-border bg-secondary/30">
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" weight="fill" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.role}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Sections */}
                  {Object.entries(megaMenuItems).map(([key, category]) => (
                    <div key={key} className="border-b border-border">
                      <div className="px-4 py-2 bg-secondary/20">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {category.title}
                        </h4>
                      </div>
                      <div className="py-1">
                        {category.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                              isActive(item.path)
                                ? 'bg-secondary text-primary'
                                : 'hover:bg-secondary/50'
                            }`}
                          >
                            <item.icon className="w-5 h-5" weight={isActive(item.path) ? 'fill' : 'regular'} />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </div>
                            <CaretRight className="w-4 h-4 ml-auto text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* User Actions (if logged in) */}
                  {user && (
                    <div className="border-b border-border">
                      <div className="px-4 py-2 bg-secondary/20">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Mon compte
                        </h4>
                      </div>
                      <div className="py-1">
                        {userMenuItems.slice(0, 4).map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                              isActive(item.path)
                                ? 'bg-secondary text-primary'
                                : 'hover:bg-secondary/50'
                            }`}
                          >
                            <item.icon className="w-5 h-5" weight={isActive(item.path) ? 'fill' : 'regular'} />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auth Actions */}
                  <div className="p-4">
                    {user ? (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 text-destructive border-destructive/30"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <SignOut className="w-4 h-4" />
                        Déconnexion
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button asChild className="w-full">
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            Connexion
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                            Inscription
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
