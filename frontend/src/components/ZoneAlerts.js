import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  Bell, 
  BellRinging, 
  MapPin, 
  Plus, 
  Trash,
  Envelope,
  DeviceMobile,
  Check,
  X
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Zone Alert Subscription Component
export const ZoneAlertSubscription = ({ 
  region = '',
  commune = '',
  onSuccess = () => {},
  trigger = null,
  className = "" 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [formData, setFormData] = useState({
    region: region,
    commune: commune,
    quartier: '',
    land_types: ['residential', 'commercial', 'agricultural'],
    max_price: '',
    min_size: '',
    notify_email: true,
    notify_sms: false
  });

  useEffect(() => {
    fetch(`${API}/regions`)
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, region: region, commune: commune }));
  }, [region, commune]);

  const handleSubmit = async () => {
    if (!formData.region) {
      toast.error('Veuillez sélectionner une région');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/zone-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          max_price: formData.max_price ? parseFloat(formData.max_price) : null,
          min_size: formData.min_size ? parseFloat(formData.min_size) : null
        })
      });

      if (res.ok) {
        toast.success('Alerte de zone créée! Vous serez notifié des nouveaux terrains.');
        setIsOpen(false);
        onSuccess();
      } else {
        toast.error('Erreur lors de la création de l\'alerte');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const toggleLandType = (type) => {
    setFormData(prev => ({
      ...prev,
      land_types: prev.land_types.includes(type)
        ? prev.land_types.filter(t => t !== type)
        : [...prev.land_types, type]
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className={`gap-2 ${className}`}
            data-testid="zone-alert-btn"
          >
            <BellRinging className="w-4 h-4" />
            Alertes zone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRinging className="w-5 h-5 text-primary" weight="fill" />
            Créer une alerte de zone
          </DialogTitle>
          <DialogDescription>
            Recevez une notification dès qu'un nouveau terrain correspondant à vos critères est publié
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Region Selection */}
          <div>
            <Label>Région *</Label>
            <Select 
              value={formData.region} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, region: v, commune: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une région" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(r => (
                  <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commune */}
          <div>
            <Label>Commune (optionnel)</Label>
            <Input
              value={formData.commune}
              onChange={(e) => setFormData(prev => ({ ...prev, commune: e.target.value }))}
              placeholder="Ex: Ratoma, Matam..."
            />
          </div>

          {/* Quartier */}
          <div>
            <Label>Quartier (optionnel)</Label>
            <Input
              value={formData.quartier}
              onChange={(e) => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
              placeholder="Ex: Nongo, Kipé..."
            />
          </div>

          {/* Land Types */}
          <div>
            <Label>Types de terrain</Label>
            <div className="flex gap-2 mt-2">
              {[
                { value: 'residential', label: 'Résidentiel' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'agricultural', label: 'Agricole' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleLandType(type.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    formData.land_types.includes(type.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Size Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prix max (GNF)</Label>
              <Input
                type="number"
                value={formData.max_price}
                onChange={(e) => setFormData(prev => ({ ...prev, max_price: e.target.value }))}
                placeholder="Ex: 500000000"
              />
            </div>
            <div>
              <Label>Surface min (m²)</Label>
              <Input
                type="number"
                value={formData.min_size}
                onChange={(e) => setFormData(prev => ({ ...prev, min_size: e.target.value }))}
                placeholder="Ex: 500"
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
            <Label className="text-base font-medium">Notifications</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Envelope className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Par email</span>
              </div>
              <Switch
                checked={formData.notify_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_email: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DeviceMobile className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Par SMS</span>
                {!user?.phone && (
                  <span className="text-xs text-muted-foreground">(ajoutez votre numéro)</span>
                )}
              </div>
              <Switch
                checked={formData.notify_sms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_sms: checked }))}
                disabled={!user?.phone}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full gap-2"
            disabled={loading || !formData.region}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Créer l'alerte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Zone Alerts List Component
export const ZoneAlertsList = ({ className = "" }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAlerts = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/zone-alerts`, {
          credentials: 'include'
        });
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
          setError(null);
        } else {
          setError('Failed to fetch alerts');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching alerts:', err);
          setError('Network error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAlerts();
    
    return () => { isMounted = false; };
  }, [user]);

  const refetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/zone-alerts`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (alertId, isActive) => {
    try {
      await fetch(`${API}/zone-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive })
      });
      refetchAlerts();
      toast.success(isActive ? 'Alerte désactivée' : 'Alerte activée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await fetch(`${API}/zone-alerts/${alertId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      refetchAlerts();
      toast.success('Alerte supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={className} data-testid="zone-alerts-list">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <BellRinging className="w-5 h-5 text-primary" weight="fill" />
          Mes alertes de zone
        </h3>
        <ZoneAlertSubscription 
          onSuccess={refetchAlerts}
          trigger={
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Nouvelle
            </Button>
          }
        />
      </div>

      {alerts.length === 0 ? (
        <div className="bg-secondary/30 p-6 text-center rounded-lg">
          <Bell className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">
            Aucune alerte de zone configurée
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Créez une alerte pour être notifié des nouveaux terrains
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.alert_id}
              className={`p-4 rounded-lg border ${
                alert.is_active 
                  ? 'bg-card border-border' 
                  : 'bg-secondary/30 border-border/50 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" weight="fill" />
                    <span className="font-medium truncate">
                      {alert.commune || alert.region}
                      {alert.quartier && `, ${alert.quartier}`}
                    </span>
                    {alert.is_active ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {alert.land_types?.map(type => (
                      <span 
                        key={type}
                        className="text-xs bg-secondary px-2 py-0.5 rounded"
                      >
                        {type === 'residential' ? 'Résidentiel' : 
                         type === 'commercial' ? 'Commercial' : 'Agricole'}
                      </span>
                    ))}
                    {alert.max_price && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        ≤{parseInt(alert.max_price).toLocaleString()} GNF
                      </span>
                    )}
                    {alert.min_size && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        ≥{parseInt(alert.min_size)} m²
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {alert.notify_email && (
                      <span className="flex items-center gap-1">
                        <Envelope className="w-3 h-3" /> Email
                      </span>
                    )}
                    {alert.notify_sms && (
                      <span className="flex items-center gap-1">
                        <DeviceMobile className="w-3 h-3" /> SMS
                      </span>
                    )}
                    {alert.last_triggered && (
                      <span>
                        Dernière alerte: {new Date(alert.last_triggered).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(alert.alert_id, alert.is_active)}
                    title={alert.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {alert.is_active ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(alert.alert_id)}
                    title="Supprimer"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZoneAlertSubscription;
