import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LandMap } from '../components/LandMap';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { WhatsAppContactButton, WhatsAppShareButton } from '../components/WhatsApp';
import { VerificationBadge, UserRatingBadge } from '../components/Reviews';
import { EnhancedPriceComparison } from '../components/MarketPrices';
import { toast } from 'sonner';
import { 
  MapPin, 
  Ruler, 
  Tag, 
  CheckCircle, 
  User, 
  Calendar,
  ArrowLeft,
  Phone,
  FileText,
  Image as ImageIcon,
  Receipt,
  Share,
  ShieldCheck,
  QrCode
} from '@phosphor-icons/react';
import { LandQRCode } from '../components/QRCode';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandDetail() {
  const { t } = useTranslation();
  const { landId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [land, setLand] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchLand();
    fetchTransactions();
  }, [landId]);

  const fetchLand = async () => {
    try {
      const res = await fetch(`${API}/lands/${landId}`);
      if (!res.ok) throw new Error('Land not found');
      const data = await res.json();
      setLand(data);
    } catch (error) {
      toast.error('Terrain non trouvé');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API}/transactions?land_id=${landId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!land) return null;

  const statusColors = {
    available: 'bg-primary text-primary-foreground',
    pending: 'bg-yellow-500 text-black',
    sold: 'bg-accent text-accent-foreground'
  };

  const statusLabels = {
    available: t('lands.status.available'),
    pending: t('lands.status.pending'),
    sold: t('lands.status.sold')
  };

  const typeLabels = {
    residential: t('lands.type.residential'),
    commercial: t('lands.type.commercial'),
    agricultural: t('lands.type.agricultural')
  };

  const defaultImage = 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=800&q=80';
  const images = land.photos?.length > 0 ? land.photos : [defaultImage];

  return (
    <div className="min-h-screen bg-background" data-testid="land-detail-page">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images & Map */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="bg-card border border-border overflow-hidden">
              <img
                src={images[activeImage]}
                alt={land.title}
                className="w-full h-80 object-cover"
              />
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-16 h-16 flex-shrink-0 border-2 ${
                        activeImage === idx ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" weight="fill" />
                  {t('land.detail.location')}
                </h3>
              </div>
              <div className="h-64">
                <LandMap 
                  lands={[land]}
                  selectedLand={land}
                  height="100%"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title & Status */}
            <div className="bg-card border border-border p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-sm font-bold px-3 py-1 ${statusColors[land.status]}`}>
                  {statusLabels[land.status]}
                </span>
                <span className="text-sm px-3 py-1 bg-secondary text-secondary-foreground">
                  {typeLabels[land.land_type]}
                </span>
                {land.verified && (
                  <span className="text-sm font-bold px-3 py-1 bg-green-600 text-white flex items-center gap-1">
                    <CheckCircle size={14} weight="fill" />
                    {t('land.detail.verified')}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black mb-2">{land.title}</h1>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-5 h-5" weight="fill" />
                <span>{land.address}, {land.commune}, {land.region}</span>
              </div>

              <div className="flex items-center gap-2 text-3xl font-black text-accent">
                <Tag className="w-8 h-8" weight="fill" />
                {land.price?.toLocaleString()} {t('common.gnf')}
              </div>
              
              {/* Price per m² */}
              {land.size > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {Math.round(land.price / land.size).toLocaleString()} GNF/m²
                </div>
              )}
            </div>

            {/* Verifications */}
            {land.verifications && land.verifications.length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" weight="fill" />
                  Vérifications officielles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {land.verifications.map((v, idx) => (
                    <VerificationBadge 
                      key={idx}
                      level={v.verification_level}
                      verifierRole={v.verifier_role}
                      verifierName={v.verifier_name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Price Comparison - Enhanced with nearby transactions */}
            <EnhancedPriceComparison 
              landId={landId} 
              landLocation={land.latitude && land.longitude ? { lat: land.latitude, lng: land.longitude } : null}
            />

            {/* Key Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Ruler className="w-4 h-4" />
                  {t('land.detail.size')}
                </div>
                <div className="text-xl font-bold">{land.size?.toLocaleString()} {t('common.m2')}</div>
              </div>
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <User className="w-4 h-4" />
                  {t('land.detail.owner')}
                </div>
                <div className="text-xl font-bold">{land.owner_name || 'N/A'}</div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border p-6">
              <h3 className="font-bold mb-3">{t('land.detail.description')}</h3>
              <p className="text-muted-foreground">{land.description}</p>
            </div>

            {/* Documents */}
            {land.documents?.length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('land.detail.documents')}
                </h3>
                <div className="space-y-2">
                  {land.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Document {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {land.status === 'available' && (
              <div className="bg-card border border-border p-6 space-y-3">
                {user ? (
                  <>
                    <Button className="w-full h-12 shadow-brutal-sm btn-hover-lift gap-2" asChild>
                      <Link to={`/transactions/new?land_id=${land.land_id}`}>
                        <Receipt className="w-5 h-5" />
                        {t('land.detail.record_transaction')}
                      </Link>
                    </Button>
                    <WhatsAppContactButton
                      ownerPhone={land.owner_phone}
                      ownerName={land.owner_name}
                      landTitle={land.title}
                      landPrice={land.price}
                      className="w-full h-12"
                    />
                  </>
                ) : (
                  <Button className="w-full h-12 shadow-brutal-sm btn-hover-lift" asChild>
                    <Link to="/login">
                      Se connecter pour contacter
                    </Link>
                  </Button>
                )}
                
                {/* Share Button */}
                <div className="pt-3 border-t border-border flex gap-2">
                  <WhatsAppShareButton
                    landTitle={land.title}
                    landPrice={land.price}
                    landLocation={`${land.commune}, ${land.region}`}
                    landUrl={window.location.href}
                    className="flex-1"
                  />
                  <LandQRCode
                    landId={land.land_id}
                    landTitle={land.title}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="mt-8 bg-card border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-accent" />
                {t('land.detail.history')}
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {transactions.map((txn) => (
                  <div key={txn.transaction_id} className="flex items-center justify-between p-4 bg-secondary/50 border border-border">
                    <div>
                      <div className="font-medium">{txn.seller_name} → {txn.buyer_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(txn.transaction_date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-accent">{txn.price?.toLocaleString()} GNF</div>
                      <Badge variant="outline">{txn.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
