import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { 
  MapTrifold, 
  ShieldCheck, 
  ClockCounterClockwise, 
  Devices,
  ArrowRight,
  House,
  Users,
  ChartLine
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_lands: 0,
    total_transactions: 0,
    total_users: 0,
    regions: []
  });

  useEffect(() => {
    fetch(`${API}/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const features = [
    {
      icon: MapTrifold,
      title: t('landing.features.map.title'),
      description: t('landing.features.map.desc')
    },
    {
      icon: ShieldCheck,
      title: t('landing.features.secure.title'),
      description: t('landing.features.secure.desc')
    },
    {
      icon: ClockCounterClockwise,
      title: t('landing.features.track.title'),
      description: t('landing.features.track.desc')
    },
    {
      icon: Devices,
      title: t('landing.features.access.title'),
      description: t('landing.features.access.desc')
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1700144068858-17d24f5c2abf?w=1920&q=80)'
          }}
        >
          <div className="absolute inset-0 bg-primary/85"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 bg-accent text-accent-foreground text-sm font-bold mb-6 animate-fade-in-up">
              GUINEA LAND HUB
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground tracking-tight leading-none mb-6 animate-fade-in-up stagger-1">
              {t('landing.hero.title')}
            </h1>
            
            <p className="text-xl sm:text-2xl text-primary-foreground/90 font-medium mb-4 animate-fade-in-up stagger-2">
              {t('landing.hero.subtitle')}
            </p>
            
            <p className="text-base sm:text-lg text-primary-foreground/70 mb-8 max-w-2xl animate-fade-in-up stagger-3">
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in-up stagger-4">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-brutal-md btn-hover-lift gap-2"
                asChild
              >
                <Link to="/map" data-testid="explore-lands-btn">
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 btn-hover-lift"
                asChild
              >
                <Link to="/listings">
                  {t('landing.hero.secondary')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: stats.total_lands || '500+', label: t('landing.stats.lands'), icon: House },
              { value: stats.total_transactions || '1,200+', label: t('landing.stats.transactions'), icon: ChartLine },
              { value: stats.total_users || '800+', label: t('landing.stats.users'), icon: Users },
              { value: stats.regions?.length || 8, label: t('landing.stats.regions'), icon: MapTrifold }
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="p-6 bg-card border border-border shadow-brutal-sm animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <stat.icon className="w-8 h-8 text-accent mb-4" weight="duotone" />
                <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {t('landing.features.title')}
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="p-6 bg-card border border-border card-hover-lift"
              >
                <div className="w-14 h-14 bg-primary flex items-center justify-center mb-4 shadow-brutal-sm">
                  <feature.icon className="w-7 h-7 text-primary-foreground" weight="duotone" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-primary-foreground mb-6">
            Prêt à commencer?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à Guinea Land Hub pour leurs transactions foncières.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-brutal-md btn-hover-lift"
              asChild
            >
              <Link to="/register" data-testid="get-started-btn">
                Créer un compte gratuit
              </Link>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/map">
                Explorer la carte
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-bold text-accent uppercase tracking-widest mb-4 block">
                Cartographie Interactive
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mb-6">
                Visualisez les terrains sur une carte détaillée
              </h2>
              <p className="text-muted-foreground mb-6">
                Notre carte interactive vous permet de visualiser tous les terrains disponibles en Guinée, 
                avec leurs délimitations précises, informations détaillées et historique des transactions.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Délimitations précises des parcelles',
                  'Filtres par région, prix et type',
                  'Informations détaillées au survol',
                  'Historique complet des transactions'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-accent flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="shadow-brutal-sm btn-hover-lift" asChild>
                <Link to="/map">
                  Accéder à la carte
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="bg-card border border-border shadow-brutal-lg p-2">
                <img 
                  src="https://images.unsplash.com/photo-1754299356969-2b7d4ffefd9e?w=800&q=80"
                  alt="Map Preview"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
