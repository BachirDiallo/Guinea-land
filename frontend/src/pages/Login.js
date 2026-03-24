import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { MapTrifold, GoogleLogo, EnvelopeSimple, Lock } from '@phosphor-icons/react';

export default function Login() {
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Connexion réussie!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1700144068858-17d24f5c2abf?w=1200&q=80)'
        }}
      >
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-accent flex items-center justify-center">
              <MapTrifold className="w-7 h-7 text-accent-foreground" weight="duotone" />
            </div>
            <span className="font-black text-xl text-primary-foreground tracking-tight">
              Guinea Land Hub
            </span>
          </Link>
          
          <div>
            <h1 className="text-4xl font-black text-primary-foreground mb-4">
              Gérez vos transactions foncières en toute confiance
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Rejoignez des milliers d'utilisateurs qui font confiance à notre plateforme pour leurs transactions foncières en Guinée.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <MapTrifold className="w-6 h-6 text-primary-foreground" weight="duotone" />
              </div>
              <span className="font-black text-lg tracking-tight">Guinea Land Hub</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black mb-2">{t('auth.login.title')}</h2>
            <p className="text-muted-foreground">
              Connectez-vous à votre compte
            </p>
          </div>

          {/* Google Login */}
          <Button 
            variant="outline" 
            className="w-full mb-6 h-12 gap-3 border-2"
            onClick={loginWithGoogle}
            data-testid="google-login-btn"
          >
            <GoogleLogo className="w-5 h-5" weight="bold" />
            {t('auth.login.google')}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="form-label">{t('auth.login.email')}</Label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  placeholder="votre@email.com"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="form-label">{t('auth.login.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  placeholder="••••••••"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 shadow-brutal-sm btn-hover-lift"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? t('common.loading') : t('auth.login.submit')}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {t('auth.login.no_account')}{' '}
            <Link to="/register" className="text-accent font-bold hover:underline">
              {t('auth.login.register_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
