import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { WifiSlash, Download, X, CheckCircle } from '@phosphor-icons/react';

// Offline Status Indicator
export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show success briefly then hide
      setTimeout(() => setShowBanner(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed top-16 left-0 right-0 z-50 px-4 py-3 flex items-center justify-center gap-3 text-sm ${
        isOnline 
          ? 'bg-green-600 text-white' 
          : 'bg-yellow-500 text-black'
      }`}
      data-testid="offline-indicator"
    >
      {isOnline ? (
        <>
          <CheckCircle className="w-5 h-5" weight="fill" />
          <span>Connexion rétablie!</span>
        </>
      ) : (
        <>
          <WifiSlash className="w-5 h-5" weight="fill" />
          <span>Mode hors ligne - Certaines fonctionnalités sont limitées</span>
        </>
      )}
      <button 
        onClick={() => setShowBanner(false)}
        className="ml-2 p-1 hover:bg-black/10 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// PWA Install Prompt
export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay (not immediately on page load)
      setTimeout(() => {
        if (!localStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-primary text-primary-foreground shadow-lg animate-fade-in-up"
      data-testid="pwa-install-prompt"
    >
      <div className="max-w-xl mx-auto flex items-center gap-4">
        <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-accent-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">Installer Guinea Land Hub</h3>
          <p className="text-xs text-primary-foreground/80 mt-1">
            Accédez rapidement à l'app même hors ligne
          </p>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-primary-foreground/70 hover:text-primary-foreground"
          >
            Plus tard
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="install-pwa-btn"
          >
            Installer
          </Button>
        </div>
      </div>
    </div>
  );
};

// Combined PWA Status component
export const PWAStatus = () => {
  return (
    <>
      <OfflineIndicator />
      <PWAInstallPrompt />
    </>
  );
};

export default PWAStatus;
