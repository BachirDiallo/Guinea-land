import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  BellRinging, 
  Check, 
  X, 
  MapPin, 
  Receipt, 
  ShieldCheck,
  TrendUp
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Notification Bell with Dropdown
export const NotificationBell = () => {
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications/history?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationIds = []) => {
    if (!token) return;
    
    try {
      await fetch(`${API}/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notification_ids: notificationIds })
      });
      
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_listing': return <MapPin className="w-4 h-4" weight="fill" />;
      case 'transaction': return <Receipt className="w-4 h-4" weight="fill" />;
      case 'verification': return <ShieldCheck className="w-4 h-4" weight="fill" />;
      case 'price_alert': return <TrendUp className="w-4 h-4" weight="fill" />;
      default: return <Bell className="w-4 h-4" weight="fill" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
        data-testid="notification-bell"
      >
        {unreadCount > 0 ? (
          <BellRinging className="w-5 h-5" weight="fill" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-80 bg-card border border-border shadow-lg z-50 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead([])}
                  className="text-xs text-primary hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    className={`p-3 border-b border-border hover:bg-secondary/50 cursor-pointer ${
                      !notif.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!notif.read) {
                        markAsRead([notif.notification_id]);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        !notif.read ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      }`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{notif.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{notif.body}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary rounded-full self-center"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Push Notification Manager Component
export const NotificationSettings = () => {
  const { user, token } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    new_listings: true,
    transaction_updates: true,
    price_alerts: true,
    verifications: true
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API}/notifications/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubscribed(data.subscribed);
          if (data.preferences) {
            setPreferences(data.preferences);
          }
        }
      } catch (error) {
        console.error('Error checking notification status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [token]);

  const handleSubscribe = async () => {
    if (!('Notification' in window)) {
      toast.error('Les notifications ne sont pas supportées par ce navigateur');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Permission refusée pour les notifications');
      return;
    }

    try {
      // In production, this would use service worker and push subscription
      // For now, we just register with the backend
      const res = await fetch(`${API}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: 'browser-' + Date.now(),
          keys: {}
        })
      });

      if (res.ok) {
        setSubscribed(true);
        toast.success('Notifications activées!');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'activation');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const res = await fetch(`${API}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint: 'browser' })
      });

      if (res.ok) {
        setSubscribed(false);
        toast.success('Notifications désactivées');
      }
    } catch (error) {
      toast.error('Erreur lors de la désactivation');
    }
  };

  const updatePreferences = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      await fetch(`${API}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ preferences: newPrefs })
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  if (!user) {
    return (
      <div className="bg-card border border-border p-6 text-center">
        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Connectez-vous pour activer les notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6" data-testid="notification-settings">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Notifications Push
      </h3>

      {!subscribed ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            Activez les notifications pour être informé des nouveaux terrains, 
            mises à jour de transactions et alertes de prix.
          </p>
          <Button onClick={handleSubscribe}>
            <BellRinging className="w-4 h-4 mr-2" />
            Activer les notifications
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <span className="font-medium">Notifications activées</span>
            </div>
            <button
              onClick={handleUnsubscribe}
              className="text-sm text-red-600 hover:underline"
            >
              Désactiver
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Préférences</h4>
            
            {[
              { key: 'new_listings', label: 'Nouveaux terrains', icon: MapPin },
              { key: 'transaction_updates', label: 'Mises à jour transactions', icon: Receipt },
              { key: 'price_alerts', label: 'Alertes de prix', icon: TrendUp },
              { key: 'verifications', label: 'Vérifications', icon: ShieldCheck }
            ].map(({ key, label, icon: Icon }) => (
              <label
                key={key}
                className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(e) => updatePreferences(key, e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default { NotificationBell, NotificationSettings };
