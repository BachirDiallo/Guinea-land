import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { MapTrifold, GoogleLogo, User, EnvelopeSimple, Lock, Phone } from '@phosphor-icons/react';

export default function Register() {
  const { t } = useTranslation();
  const { register, loginWithGoogle, login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'buyer'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success('Compte créé avec succès!');
      // Auto login after registration
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
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
            <h2 className="text-3xl font-black mb-2">{t('auth.register.title')}</h2>
            <p className="text-muted-foreground">
              Créez votre compte en quelques minutes
            </p>
          </div>

          {/* Google Register */}
          <Button 
            variant="outline" 
            className="w-full mb-6 h-12 gap-3 border-2"
            onClick={loginWithGoogle}
            data-testid="google-register-btn"
          >
            <GoogleLogo className="w-5 h-5" weight="bold" />
            {t('auth.register.google')}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="form-label">{t('auth.register.name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="pl-10 h-12"
                  placeholder="Votre nom complet"
                  required
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="form-label">{t('auth.register.email')}</Label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="pl-10 h-12"
                  placeholder="votre@email.com"
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="form-label">{t('auth.register.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pl-10 h-12"
                  placeholder="••••••••"
                  minLength={6}
                  required
                  data-testid="register-password-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="form-label">{t('auth.register.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="pl-10 h-12"
                  placeholder="+224 XXX XXX XXX"
                  data-testid="register-phone-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="form-label">{t('auth.register.role')}</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger className="h-12" data-testid="register-role-select">
                  <SelectValue placeholder="Sélectionnez un type de compte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">{t('auth.register.role.buyer')}</SelectItem>
                  <SelectItem value="seller">{t('auth.register.role.seller')}</SelectItem>
                  <SelectItem value="agent">{t('auth.register.role.agent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 shadow-brutal-sm btn-hover-lift"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? t('common.loading') : t('auth.register.submit')}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {t('auth.register.has_account')}{' '}
            <Link to="/login" className="text-accent font-bold hover:underline">
              {t('auth.register.login_link')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=1200&q=80)'
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
              Commencez dès aujourd'hui
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Inscrivez-vous gratuitement et accédez à tous les terrains disponibles en Guinée. 
              Gérez vos transactions en toute sécurité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
