import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, EnvelopeSimple, Phone, MapPin, Pencil } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { t } = useTranslation();
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      await checkAuth();
      toast.success('Profil mis à jour!');
      setEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    buyer: 'Acheteur',
    seller: 'Vendeur',
    agent: 'Agent Immobilier',
    admin: 'Administrateur'
  };

  return (
    <div className="min-h-screen bg-background" data-testid="profile-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-24 h-24 rounded-full border-4 border-primary-foreground/30"
              />
            ) : (
              <div className="w-24 h-24 bg-accent flex items-center justify-center rounded-full">
                <User className="w-12 h-12 text-accent-foreground" weight="fill" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black">{user?.name}</h1>
              <p className="text-primary-foreground/80">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-accent text-accent-foreground text-sm font-bold">
                {roleLabels[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-black">{t('profile.title')}</h2>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
                <Pencil className="w-4 h-4" />
                {t('profile.edit')}
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="form-label flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('profile.name')}
              </Label>
              {editing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  data-testid="profile-name-input"
                />
              ) : (
                <p className="py-2">{user?.name || '-'}</p>
              )}
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label className="form-label flex items-center gap-2">
                <EnvelopeSimple className="w-4 h-4" />
                {t('profile.email')}
              </Label>
              <p className="py-2 text-muted-foreground">{user?.email}</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="form-label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('profile.phone')}
              </Label>
              {editing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+224 XXX XXX XXX"
                  data-testid="profile-phone-input"
                />
              ) : (
                <p className="py-2">{user?.phone || '-'}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="form-label flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('profile.address')}
              </Label>
              {editing ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Votre adresse"
                  data-testid="profile-address-input"
                />
              ) : (
                <p className="py-2">{user?.address || '-'}</p>
              )}
            </div>

            {/* Role (readonly) */}
            <div className="space-y-2">
              <Label className="form-label">{t('profile.role')}</Label>
              <p className="py-2">{roleLabels[user?.role] || user?.role}</p>
            </div>

            {/* Actions */}
            {editing && (
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button 
                  type="submit" 
                  className="shadow-brutal-sm btn-hover-lift"
                  disabled={loading}
                  data-testid="save-profile-btn"
                >
                  {loading ? t('common.loading') : t('profile.save')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      address: user?.address || ''
                    });
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
