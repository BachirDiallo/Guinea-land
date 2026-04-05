import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ZoneAlertsList, ZoneAlertSubscription } from '../components/ZoneAlerts';
import { Button } from '../components/ui/button';
import { 
  BellRinging, 
  MapPin,
  Info,
  ArrowLeft
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ZoneAlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [smsConfigured, setSmsConfigured] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAlertCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    // Check if SMS is configured
    fetch(`${API}/sms/status`)
      .then(res => res.json())
      .then(data => setSmsConfigured(data.configured))
      .catch(() => setSmsConfigured(false));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BellRinging className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground mb-4">
            Connectez-vous pour gérer vos alertes de zone
          </p>
          <Button onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="zone-alerts-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="gap-2 mb-4 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <BellRinging className="w-8 h-8" weight="fill" />
            <h1 className="text-2xl sm:text-3xl font-black">
              Alertes de Zone
            </h1>
          </div>
          <p className="text-primary-foreground/80">
            Soyez notifié dès qu'un nouveau terrain correspond à vos critères
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-accent">Comment ça marche?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Créez une alerte en sélectionnant une région, commune ou quartier. 
                Dès qu'un nouveau terrain correspondant à vos critères est publié, 
                vous recevrez une notification par email{smsConfigured ? ' ou SMS' : ''}.
              </p>
            </div>
          </div>
        </div>

        {/* How to use section */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border p-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-primary" weight="fill" />
            </div>
            <h3 className="font-bold text-sm mb-1">1. Choisissez une zone</h3>
            <p className="text-xs text-muted-foreground">
              Sélectionnez la région, commune ou quartier qui vous intéresse
            </p>
          </div>
          
          <div className="bg-card border border-border p-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm mb-1">2. Définissez vos critères</h3>
            <p className="text-xs text-muted-foreground">
              Type de terrain, prix maximum, surface minimum
            </p>
          </div>
          
          <div className="bg-card border border-border p-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <BellRinging className="w-6 h-6 text-primary" weight="fill" />
            </div>
            <h3 className="font-bold text-sm mb-1">3. Recevez les alertes</h3>
            <p className="text-xs text-muted-foreground">
              Notification instantanée par email{smsConfigured ? ' ou SMS' : ''} dès qu'un terrain correspond
            </p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <ZoneAlertsList key={refreshKey} />
        </div>

        {/* Quick create for popular zones */}
        <div className="mt-8">
          <h3 className="font-bold mb-4">Zones populaires</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { region: 'Conakry', commune: 'Ratoma' },
              { region: 'Conakry', commune: 'Kaloum' },
              { region: 'Conakry', commune: 'Matam' },
              { region: 'Kindia', commune: '' },
              { region: 'Labé', commune: '' },
            ].map((zone, idx) => (
              <ZoneAlertSubscription
                key={idx}
                region={zone.region}
                commune={zone.commune}
                onSuccess={handleAlertCreated}
                trigger={
                  <Button variant="outline" size="sm" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {zone.commune || zone.region}
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
