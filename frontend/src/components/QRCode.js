import { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './ui/dialog';
import { QrCode, Download, Printer } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// QR Code Display Component
export const LandQRCode = ({ 
  landId, 
  landTitle,
  size = 200,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const qrCodeUrl = `${API}/lands/${landId}/qrcode?size=${size}`;
  const downloadUrl = `${API}/lands/${landId}/qrcode/download?size=512&include_info=true`;

  const handleDownload = async () => {
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terrain_qr_${landId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${landTitle}</title>
        <style>
          body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
          }
          .container { text-align: center; }
          img { max-width: 400px; }
          h3 { margin-top: 20px; color: #133E26; }
          p { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${downloadUrl}" alt="QR Code" />
          <p>Scannez ce code pour voir les détails du terrain</p>
          <p>Guinea Land Hub</p>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`gap-2 ${className}`}
          data-testid="qr-code-btn"
        >
          <QrCode className="w-4 h-4" />
          Code QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" weight="fill" />
            Code QR du terrain
          </DialogTitle>
          <DialogDescription className="sr-only">
            Scannez ce code QR pour accéder aux détails du terrain
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-2 border-primary/20">
            <img 
              src={qrCodeUrl}
              alt={`QR Code pour ${landTitle}`}
              className="w-48 h-48"
              data-testid="qr-code-image"
            />
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Scannez ce code QR pour accéder aux détails du terrain
          </p>
          
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={handleDownload}
              className="gap-2"
              data-testid="qr-download-btn"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </Button>
            <Button 
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
              data-testid="qr-print-btn"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </div>
        
        <div className="bg-secondary/50 p-3 rounded text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Utilisations:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Afficher sur un panneau sur le terrain</li>
            <li>Partager avec des acheteurs potentiels</li>
            <li>Inclure dans vos documents de vente</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Compact QR Code for cards
export const QRCodeBadge = ({ landId, className = "" }) => {
  const qrCodeUrl = `${API}/lands/${landId}/qrcode?size=64`;
  
  return (
    <div 
      className={`bg-white p-1 rounded shadow-sm ${className}`}
      title="Scannez pour voir les détails"
    >
      <img 
        src={qrCodeUrl}
        alt="QR Code"
        className="w-12 h-12"
      />
    </div>
  );
};

export default LandQRCode;
