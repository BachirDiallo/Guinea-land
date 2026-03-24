import { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { WhatsappLogo, Share, PaperPlaneTilt } from '@phosphor-icons/react';

// WhatsApp Guinea country code
const GUINEA_COUNTRY_CODE = '224';

// Format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Guinea country code if not present
  if (!cleaned.startsWith('224') && !cleaned.startsWith('+224')) {
    cleaned = GUINEA_COUNTRY_CODE + cleaned;
  }
  
  // Remove leading + if present
  cleaned = cleaned.replace(/^\+/, '');
  
  return cleaned;
};

// Generate WhatsApp URL
const getWhatsAppUrl = (phone, message) => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return null;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

// WhatsApp Contact Button for contacting land owner
export const WhatsAppContactButton = ({ 
  ownerPhone, 
  ownerName, 
  landTitle, 
  landPrice,
  className = "" 
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const defaultMessage = `Bonjour ${ownerName || ''},

Je suis intéressé(e) par votre terrain "${landTitle}" listé sur Guinea Land Hub au prix de ${landPrice?.toLocaleString() || 'N/A'} GNF.

Pourriez-vous me fournir plus d'informations?

Merci.`;

  const handleSendMessage = () => {
    const message = customMessage || defaultMessage;
    const url = getWhatsAppUrl(ownerPhone, message);
    
    if (url) {
      window.open(url, '_blank');
      setDialogOpen(false);
    }
  };

  // If no phone, show disabled button
  if (!ownerPhone) {
    return (
      <Button 
        variant="outline" 
        className={`gap-2 opacity-50 cursor-not-allowed ${className}`}
        disabled
      >
        <WhatsappLogo className="w-5 h-5" weight="fill" />
        WhatsApp non disponible
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-0 ${className}`}
          data-testid="whatsapp-contact-btn"
        >
          <WhatsappLogo className="w-5 h-5" weight="fill" />
          Contacter via WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WhatsappLogo className="w-6 h-6 text-[#25D366]" weight="fill" />
            Contacter le propriétaire
          </DialogTitle>
          <DialogDescription>
            Envoyez un message WhatsApp à {ownerName || 'le propriétaire'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label className="form-label">Message</Label>
            <Textarea
              value={customMessage || defaultMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              className="mt-2"
              data-testid="whatsapp-message-input"
            />
          </div>
          
          <Button 
            onClick={handleSendMessage}
            className="w-full gap-2 bg-[#25D366] hover:bg-[#128C7E]"
            data-testid="send-whatsapp-btn"
          >
            <PaperPlaneTilt className="w-5 h-5" />
            Envoyer via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// WhatsApp Share Button for sharing land listings
export const WhatsAppShareButton = ({ 
  landTitle, 
  landPrice, 
  landLocation,
  landUrl,
  className = "" 
}) => {
  const shareMessage = `🏠 Terrain à vendre sur Guinea Land Hub!

📍 ${landTitle}
📌 ${landLocation}
💰 ${landPrice?.toLocaleString() || 'N/A'} GNF

Voir les détails: ${landUrl || window.location.href}`;

  const handleShare = () => {
    // Use Web Share API if available (mobile)
    if (navigator.share) {
      navigator.share({
        title: `Terrain: ${landTitle}`,
        text: shareMessage,
        url: landUrl || window.location.href
      }).catch(() => {
        // Fallback to WhatsApp direct
        openWhatsAppShare();
      });
    } else {
      openWhatsAppShare();
    }
  };

  const openWhatsAppShare = () => {
    const encodedMessage = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleShare}
      className={`gap-2 ${className}`}
      data-testid="whatsapp-share-btn"
    >
      <Share className="w-4 h-4" />
      Partager
    </Button>
  );
};

// WhatsApp Transaction Share - for sharing completed transactions
export const WhatsAppTransactionShare = ({
  transactionId,
  landTitle,
  price,
  buyerName,
  sellerName,
  className = ""
}) => {
  const shareMessage = `✅ Transaction complétée sur Guinea Land Hub!

📋 Référence: ${transactionId}
🏠 Terrain: ${landTitle}
👤 Vendeur: ${sellerName}
👤 Acheteur: ${buyerName}
💰 Prix: ${price?.toLocaleString()} GNF

Guinea Land Hub - Transactions foncières sécurisées en Guinée`;

  const handleShare = () => {
    const encodedMessage = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleShare}
      className={`gap-2 ${className}`}
      data-testid="whatsapp-transaction-share-btn"
    >
      <WhatsappLogo className="w-4 h-4" weight="fill" />
      Partager sur WhatsApp
    </Button>
  );
};

// Floating WhatsApp Help Button
export const WhatsAppHelpButton = ({ 
  supportPhone = '621000000', // Default Guinea support number
  className = "" 
}) => {
  const message = `Bonjour, j'ai besoin d'aide avec Guinea Land Hub.`;
  const url = getWhatsAppUrl(supportPhone, message);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${className}`}
      data-testid="whatsapp-help-btn"
      aria-label="Aide WhatsApp"
    >
      <WhatsappLogo className="w-8 h-8 text-white" weight="fill" />
    </a>
  );
};

export default WhatsAppContactButton;
