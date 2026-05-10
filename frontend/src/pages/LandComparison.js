import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { WhatsAppShareButton } from '../components/WhatsApp';
import { LandQRCode } from '../components/QRCode';
import { 
  Scales, 
  MapPin, 
  Ruler, 
  Tag, 
  CheckCircle,
  Trophy,
  X,
  Plus,
  Star,
  Crown,
  Medal,
  CurrencyCircleDollar,
  ArrowRight,
  Share,
  Heart,
  CaretRight,
  Check,
  Warning,
  ShieldCheck,
  MapTrifold,
  ListBullets,
  ChartBar,
  Export,
  WhatsappLogo,
  Shield,
  Buildings,
  ChartLineUp,
  Users,
  Files,
  TrendUp,
  TrendDown,
  Minus,
  Info
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function LandComparison() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [selectedLands, setSelectedLands] = useState([]);
  const [availableLands, setAvailableLands] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // cards, table, map
  const mapRef = useRef(null);

  // Get land IDs from URL
  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      setSelectedLands(ids.split(','));
    }
  }, [searchParams]);

  // Fetch available lands for selection
  useEffect(() => {
    fetch(`${API}/lands?status=available&limit=100`)
      .then(res => res.json())
      .then(data => setAvailableLands(data))
      .catch(console.error);
  }, []);

  // Fetch comparison when lands selected
  useEffect(() => {
    if (selectedLands.length >= 2) {
      fetchComparison();
      // Update URL
      setSearchParams({ ids: selectedLands.join(',') });
    } else {
      setComparison(null);
    }
  }, [selectedLands]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ land_ids: selectedLands })
      });
      if (res.ok) {
        setComparison(await res.json());
      }
    } catch (error) {
      console.error('Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLand = (landId) => {
    if (selectedLands.length < 4 && !selectedLands.includes(landId)) {
      setSelectedLands([...selectedLands, landId]);
    }
    setShowSelector(false);
  };

  const removeLand = (landId) => {
    setSelectedLands(selectedLands.filter(id => id !== landId));
  };

  const clearAll = () => {
    setSelectedLands([]);
    setSearchParams({});
  };

  // Filter available lands
  const filteredLands = availableLands.filter(land => 
    !selectedLands.includes(land.land_id) &&
    (land.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     land.commune?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     land.region?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate best values
  const getBestValue = (metric) => {
    if (!comparison?.lands || comparison.lands.length === 0) return null;
    
    switch (metric) {
      case 'price':
        return comparison.lands.reduce((min, land) => 
          land.price < min.price ? land : min
        ).land_id;
      case 'price_per_m2':
        return comparison.lands.reduce((min, land) => 
          land.price_per_m2 < min.price_per_m2 ? land : min
        ).land_id;
      case 'size':
        return comparison.lands.reduce((max, land) => 
          land.size > max.size ? land : max
        ).land_id;
      case 'trust_score':
        return comparison.lands.reduce((max, land) => 
          (land.trust_score || 0) > (max.trust_score || 0) ? land : max
        ).land_id;
      case 'risk_score':
        return comparison.lands.reduce((max, land) => 
          (land.risk_score || 0) > (max.risk_score || 0) ? land : max
        ).land_id;
      case 'infrastructure_score':
        return comparison.lands.reduce((max, land) => 
          (land.infrastructure_score || 0) > (max.infrastructure_score || 0) ? land : max
        ).land_id;
      case 'investment_score':
        return comparison.lands.reduce((max, land) => 
          (land.investment_score || 0) > (max.investment_score || 0) ? land : max
        ).land_id;
      default:
        return null;
    }
  };

  const isBest = (landId, metric) => getBestValue(metric) === landId;

  const defaultImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80';

  // Get map bounds
  const getMapBounds = () => {
    if (!comparison?.lands) return null;
    const coords = comparison.lands
      .filter(l => l.latitude && l.longitude)
      .map(l => [l.longitude, l.latitude]);
    if (coords.length === 0) return null;
    
    return {
      minLng: Math.min(...coords.map(c => c[0])) - 0.05,
      maxLng: Math.max(...coords.map(c => c[0])) + 0.05,
      minLat: Math.min(...coords.map(c => c[1])) - 0.05,
      maxLat: Math.max(...coords.map(c => c[1])) + 0.05,
    };
  };

  // Share comparison
  const shareComparison = () => {
    const url = window.location.href;
    const text = `Comparer ces terrains sur Guinea Land Hub: ${comparison?.lands?.map(l => l.title).join(' vs ')}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Comparaison de terrains', text, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Lien copié!');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="land-comparison-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Scales className="w-8 h-8" weight="fill" />
                <h1 className="text-2xl sm:text-3xl font-black">
                  Comparer les Terrains
                </h1>
              </div>
              <p className="text-primary-foreground/80">
                Comparez jusqu'à 4 terrains côte à côte
              </p>
            </div>
            
            {comparison && (
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={shareComparison}
                  className="gap-2"
                >
                  <Share className="w-4 h-4" />
                  Partager
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selection Bar */}
        <div className="bg-card border border-border p-4 mb-6 rounded-lg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Selected Lands */}
            {selectedLands.map((landId, index) => {
              const land = comparison?.lands?.find(l => l.land_id === landId) || 
                           availableLands.find(l => l.land_id === landId);
              return (
                <div 
                  key={landId}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-primary text-primary-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {land?.title || landId}
                  </span>
                  <button 
                    onClick={() => removeLand(landId)}
                    className="hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Add Button */}
            {selectedLands.length < 4 && (
              <Dialog open={showSelector} onOpenChange={setShowSelector}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un terrain
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Sélectionner un terrain</DialogTitle>
                  </DialogHeader>
                  <div className="mb-4">
                    <Input
                      placeholder="Rechercher par titre, commune..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 -mx-6 px-6">
                    <div className="space-y-2">
                      {filteredLands.slice(0, 20).map(land => (
                        <div
                          key={land.land_id}
                          onClick={() => addLand(land.land_id)}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                        >
                          <img
                            src={land.photos?.[0] || defaultImage}
                            alt={land.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{land.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {land.commune}, {land.region} • {land.size?.toLocaleString()} m²
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-accent text-sm">
                              {land.price?.toLocaleString()} GNF
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredLands.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucun terrain trouvé
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Clear All */}
            {selectedLands.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                Tout effacer
              </Button>
            )}

            {/* View Mode Toggle */}
            {comparison && (
              <div className="ml-auto flex items-center gap-1 bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-card shadow' : ''}`}
                  title="Vue cartes"
                >
                  <ListBullets className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-card shadow' : ''}`}
                  title="Vue tableau"
                >
                  <ChartBar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded ${viewMode === 'map' ? 'bg-card shadow' : ''}`}
                  title="Vue carte"
                >
                  <MapTrifold className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {selectedLands.length < 2 && (
          <div className="bg-card border border-border p-12 text-center rounded-lg">
            <Scales className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">
              Sélectionnez au moins 2 terrains
            </h3>
            <p className="text-muted-foreground mb-6">
              Comparez les prix, tailles et caractéristiques de différents terrains
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {availableLands.slice(0, 4).map(land => (
                <Button 
                  key={land.land_id}
                  variant="outline" 
                  size="sm"
                  onClick={() => addLand(land.land_id)}
                >
                  {land.title?.substring(0, 20)}...
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Comparison Results */}
        {comparison && !loading && (
          <>
            {/* Quick Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">Prix le plus bas</div>
                <div className="text-xl font-bold text-green-600">
                  {Math.min(...comparison.lands.map(l => l.price)).toLocaleString()} GNF
                </div>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">Meilleur prix/m²</div>
                <div className="text-xl font-bold text-blue-600">
                  {Math.min(...comparison.lands.map(l => l.price_per_m2)).toLocaleString()} GNF
                </div>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">Plus grand</div>
                <div className="text-xl font-bold text-purple-600">
                  {Math.max(...comparison.lands.map(l => l.size)).toLocaleString()} m²
                </div>
              </div>
            </div>

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className={`grid gap-4 ${
                comparison.lands.length === 2 ? 'md:grid-cols-2' :
                comparison.lands.length === 3 ? 'md:grid-cols-3' :
                'md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {comparison.lands.map((land, index) => (
                  <div 
                    key={land.land_id}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    {/* Rank Badge */}
                    <div className="relative">
                      <img
                        src={land.photos?.[0] || defaultImage}
                        alt={land.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-primary text-primary-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Best Value Badges */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {isBest(land.land_id, 'price') && (
                          <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Moins cher
                          </div>
                        )}
                        {isBest(land.land_id, 'price_per_m2') && (
                          <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                            <Medal className="w-3 h-3" /> Meilleur /m²
                          </div>
                        )}
                        {isBest(land.land_id, 'size') && (
                          <div className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                            <Ruler className="w-3 h-3" /> Plus grand
                          </div>
                        )}
                      </div>

                      {land.verified && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Vérifié
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{land.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        {land.commune}, {land.region}
                      </div>

                      {/* Key Metrics */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Prix</span>
                          <span className={`font-bold ${isBest(land.land_id, 'price') ? 'text-green-600' : ''}`}>
                            {land.price?.toLocaleString()} GNF
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Surface</span>
                          <span className={`font-bold ${isBest(land.land_id, 'size') ? 'text-purple-600' : ''}`}>
                            {land.size?.toLocaleString()} m²
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Prix/m²</span>
                          <span className={`font-bold ${isBest(land.land_id, 'price_per_m2') ? 'text-blue-600' : ''}`}>
                            {land.price_per_m2?.toLocaleString()} GNF
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Type</span>
                          <span className="capitalize">{land.land_type}</span>
                        </div>
                      </div>

                      {/* Trust & Security Metrics */}
                      <div className="border-t border-border pt-3 mb-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Confiance & Sécurité
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Trust Score */}
                          <div className={`p-2 rounded text-center ${isBest(land.land_id, 'trust_score') ? 'bg-green-50 border border-green-200' : 'bg-secondary/30'}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'trust_score') ? 'text-green-600' : ''}`}>
                              {land.trust_score || 0}%
                            </div>
                            <div className="text-[10px] text-muted-foreground">Confiance</div>
                            {isBest(land.land_id, 'trust_score') && (
                              <Trophy className="w-3 h-3 text-green-600 mx-auto mt-1" weight="fill" />
                            )}
                          </div>
                          {/* Risk Score */}
                          <div className={`p-2 rounded text-center ${isBest(land.land_id, 'risk_score') ? 'bg-blue-50 border border-blue-200' : 'bg-secondary/30'}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'risk_score') ? 'text-blue-600' : ''}`}>
                              {land.risk_score || 0}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Sécurité</div>
                            {isBest(land.land_id, 'risk_score') && (
                              <Trophy className="w-3 h-3 text-blue-600 mx-auto mt-1" weight="fill" />
                            )}
                          </div>
                          {/* Infrastructure */}
                          <div className={`p-2 rounded text-center ${isBest(land.land_id, 'infrastructure_score') ? 'bg-purple-50 border border-purple-200' : 'bg-secondary/30'}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'infrastructure_score') ? 'text-purple-600' : ''}`}>
                              {land.infrastructure_grade || '?'}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Infra.</div>
                            {isBest(land.land_id, 'infrastructure_score') && (
                              <Trophy className="w-3 h-3 text-purple-600 mx-auto mt-1" weight="fill" />
                            )}
                          </div>
                          {/* Investment */}
                          <div className={`p-2 rounded text-center ${isBest(land.land_id, 'investment_score') ? 'bg-yellow-50 border border-yellow-200' : 'bg-secondary/30'}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'investment_score') ? 'text-yellow-600' : ''}`}>
                              {land.investment_score || 0}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Invest.</div>
                            {isBest(land.land_id, 'investment_score') && (
                              <Trophy className="w-3 h-3 text-yellow-600 mx-auto mt-1" weight="fill" />
                            )}
                          </div>
                        </div>
                        
                        {/* Price Assessment Badge */}
                        {land.price_assessment && land.price_assessment !== 'unknown' && (
                          <div className={`mt-2 text-center text-xs py-1 px-2 rounded-full ${
                            land.price_assessment === 'good_deal' || land.price_assessment === 'underpriced' 
                              ? 'bg-green-100 text-green-700' 
                              : land.price_assessment === 'fair' 
                              ? 'bg-blue-100 text-blue-700'
                              : land.price_assessment === 'slightly_high'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {land.price_assessment === 'good_deal' && '✓ Bonne affaire'}
                            {land.price_assessment === 'underpriced' && '✓ Sous-évalué'}
                            {land.price_assessment === 'fair' && '• Prix juste'}
                            {land.price_assessment === 'slightly_high' && '↑ Légèrement élevé'}
                            {land.price_assessment === 'overpriced' && '↑↑ Au-dessus du marché'}
                          </div>
                        )}
                      </div>

                      {/* Visual Bar for Price per m² */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Prix/m² relatif</div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isBest(land.land_id, 'price_per_m2') ? 'bg-blue-500' : 'bg-primary'}`}
                            style={{ 
                              width: `${(Math.min(...comparison.lands.map(l => l.price_per_m2)) / land.price_per_m2) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/lands/${land.land_id}`)}
                        >
                          Voir détails
                        </Button>
                        <LandQRCode landId={land.land_id} landTitle={land.title} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left p-4 font-medium">Caractéristique</th>
                        {comparison.lands.map((land, index) => (
                          <th key={land.land_id} className="text-center p-4">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                'bg-primary text-primary-foreground'
                              }`}>{index + 1}</span>
                              <span className="font-bold truncate max-w-[120px]">{land.title}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Photo</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center">
                            <img 
                              src={land.photos?.[0] || defaultImage}
                              alt={land.title}
                              className="w-24 h-16 object-cover rounded mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Prix</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center font-bold ${isBest(land.land_id, 'price') ? 'text-green-600 bg-green-50' : ''}`}>
                            {land.price?.toLocaleString()} GNF
                            {isBest(land.land_id, 'price') && <Trophy className="w-4 h-4 inline ml-1" />}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Surface</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center font-bold ${isBest(land.land_id, 'size') ? 'text-purple-600 bg-purple-50' : ''}`}>
                            {land.size?.toLocaleString()} m²
                            {isBest(land.land_id, 'size') && <Crown className="w-4 h-4 inline ml-1" />}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Prix/m²</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center font-bold ${isBest(land.land_id, 'price_per_m2') ? 'text-blue-600 bg-blue-50' : ''}`}>
                            {land.price_per_m2?.toLocaleString()} GNF
                            {isBest(land.land_id, 'price_per_m2') && <Medal className="w-4 h-4 inline ml-1" />}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Localisation</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center text-sm">
                            {land.commune}, {land.region}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Type</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center capitalize">
                            {land.land_type}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Vérifié</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center">
                            {land.verified ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                      
                      {/* TRUST & SECURITY SECTION */}
                      <tr className="border-t-2 border-primary/30 bg-primary/5">
                        <td colSpan={comparison.lands.length + 1} className="p-3 font-bold text-primary flex items-center gap-2">
                          <Shield className="w-4 h-4" weight="fill" /> Confiance & Sécurité
                        </td>
                      </tr>
                      
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Score de Confiance</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center ${isBest(land.land_id, 'trust_score') ? 'bg-green-50' : ''}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'trust_score') ? 'text-green-600' : ''}`}>
                              {land.trust_score || 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">{land.trust_label || 'Non évalué'}</div>
                            {isBest(land.land_id, 'trust_score') && <Trophy className="w-4 h-4 text-green-600 mx-auto mt-1" weight="fill" />}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Score Sécurité</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center ${isBest(land.land_id, 'risk_score') ? 'bg-blue-50' : ''}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'risk_score') ? 'text-blue-600' : ''}`}>
                              {land.risk_score || 0}/100
                            </div>
                            <div className="text-xs text-muted-foreground">{land.risk_label || 'Non évalué'}</div>
                            {isBest(land.land_id, 'risk_score') && <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto mt-1" weight="fill" />}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Infrastructure</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center ${isBest(land.land_id, 'infrastructure_score') ? 'bg-purple-50' : ''}`}>
                            <div className={`text-2xl font-black ${isBest(land.land_id, 'infrastructure_score') ? 'text-purple-600' : ''}`}>
                              {land.infrastructure_grade || '?'}
                            </div>
                            <div className="text-xs text-muted-foreground">{land.infrastructure_label || 'Non évalué'}</div>
                            {isBest(land.land_id, 'infrastructure_score') && <Buildings className="w-4 h-4 text-purple-600 mx-auto mt-1" weight="fill" />}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Potentiel Investissement</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className={`p-4 text-center ${isBest(land.land_id, 'investment_score') ? 'bg-yellow-50' : ''}`}>
                            <div className={`text-lg font-bold ${isBest(land.land_id, 'investment_score') ? 'text-yellow-600' : ''}`}>
                              {land.investment_score || 0}/100
                            </div>
                            <div className="text-xs text-muted-foreground">{land.investment_label || 'Non évalué'}</div>
                            {isBest(land.land_id, 'investment_score') && <ChartLineUp className="w-4 h-4 text-yellow-600 mx-auto mt-1" weight="fill" />}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Évaluation Prix</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              land.price_assessment === 'good_deal' || land.price_assessment === 'underpriced'
                                ? 'bg-green-100 text-green-700'
                                : land.price_assessment === 'fair'
                                ? 'bg-blue-100 text-blue-700'
                                : land.price_assessment === 'slightly_high'
                                ? 'bg-yellow-100 text-yellow-700'
                                : land.price_assessment === 'overpriced'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {land.price_assessment === 'good_deal' && <><TrendDown className="w-3 h-3" /> Bonne affaire</>}
                              {land.price_assessment === 'underpriced' && <><TrendDown className="w-3 h-3" /> Sous-évalué</>}
                              {land.price_assessment === 'fair' && <><Minus className="w-3 h-3" /> Prix juste</>}
                              {land.price_assessment === 'slightly_high' && <><TrendUp className="w-3 h-3" /> Légèrement élevé</>}
                              {land.price_assessment === 'overpriced' && <><TrendUp className="w-3 h-3" /> Au-dessus du marché</>}
                              {(!land.price_assessment || land.price_assessment === 'unknown') && <><Info className="w-3 h-3" /> Non évalué</>}
                            </span>
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Vérifications Communautaires</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold">{land.community_verifications || 0}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border">
                        <td className="p-4 font-medium">Documents</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Files className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold">{land.documents_count || 0}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-t border-border bg-secondary/30">
                        <td className="p-4 font-medium">Actions</td>
                        {comparison.lands.map(land => (
                          <td key={land.land_id} className="p-4 text-center">
                            <Button size="sm" asChild>
                              <Link to={`/lands/${land.land_id}`}>
                                Voir <CaretRight className="w-4 h-4 ml-1" />
                              </Link>
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && MAPBOX_TOKEN && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="h-[500px]">
                  <Map
                    ref={mapRef}
                    initialViewState={{
                      longitude: comparison.lands[0]?.longitude || -13.6,
                      latitude: comparison.lands[0]?.latitude || 9.6,
                      zoom: 10
                    }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    mapboxAccessToken={MAPBOX_TOKEN}
                  >
                    {comparison.lands.map((land, index) => (
                      land.latitude && land.longitude && (
                        <Marker
                          key={land.land_id}
                          longitude={land.longitude}
                          latitude={land.latitude}
                        >
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-primary text-primary-foreground'
                            }`}
                            onClick={() => navigate(`/lands/${land.land_id}`)}
                          >
                            {index + 1}
                          </div>
                        </Marker>
                      )
                    ))}
                  </Map>
                </div>
                
                {/* Map Legend */}
                <div className="p-4 border-t border-border bg-secondary/30">
                  <div className="flex flex-wrap gap-4">
                    {comparison.lands.map((land, index) => (
                      <div key={land.land_id} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-primary text-primary-foreground'
                        }`}>{index + 1}</span>
                        <span className="text-sm">{land.title}</span>
                        <span className="text-sm text-muted-foreground">
                          ({land.price?.toLocaleString()} GNF)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {comparison.lands.length >= 2 && (
              <div className="mt-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Notre recommandation</h3>
                    {(() => {
                      const bestPricePerM2 = comparison.lands.reduce((min, l) => 
                        l.price_per_m2 < min.price_per_m2 ? l : min
                      );
                      return (
                        <>
                          <p className="text-muted-foreground mb-3">
                            Basé sur le meilleur rapport qualité-prix (prix/m²), nous recommandons:
                          </p>
                          <div className="flex items-center gap-3">
                            <img 
                              src={bestPricePerM2.photos?.[0] || defaultImage}
                              alt={bestPricePerM2.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="font-bold">{bestPricePerM2.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {bestPricePerM2.price_per_m2?.toLocaleString()} GNF/m² • {bestPricePerM2.size?.toLocaleString()} m²
                              </div>
                            </div>
                            <Button size="sm" asChild className="ml-auto">
                              <Link to={`/lands/${bestPricePerM2.land_id}`}>
                                Voir ce terrain
                              </Link>
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
