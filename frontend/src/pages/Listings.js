import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import { LandCard } from '../components/LandCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  MagnifyingGlass, 
  Funnel, 
  X, 
  CaretDown,
  SquaresFour,
  List,
  MapTrifold,
  Table,
  GridNine,
  MapPin,
  Ruler,
  Tag,
  CheckCircle,
  CaretRight,
  SortAscending,
  SortDescending,
  Heart,
  Share,
  Eye
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// View mode options
const VIEW_MODES = {
  grid: { icon: SquaresFour, label: 'Grille', cols: 'sm:grid-cols-2 lg:grid-cols-3' },
  list: { icon: List, label: 'Liste', cols: 'grid-cols-1' },
  compact: { icon: GridNine, label: 'Compact', cols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' },
  map: { icon: MapTrifold, label: 'Carte', cols: 'grid-cols-1' },
  table: { icon: Table, label: 'Tableau', cols: 'grid-cols-1' }
};

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'size_asc', label: 'Surface croissante' },
  { value: 'size_desc', label: 'Surface décroissante' }
];

// List View Card Component
const ListViewCard = ({ land }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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

  return (
    <div 
      className="bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
      onClick={() => navigate(`/lands/${land.land_id}`)}
      data-testid={`land-list-item-${land.land_id}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-64 h-48 sm:h-44 flex-shrink-0 overflow-hidden">
          <img
            src={land.photos?.[0] || defaultImage}
            alt={land.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 flex gap-2">
            <span className={`text-xs font-bold px-2 py-1 ${statusColors[land.status]}`}>
              {statusLabels[land.status]}
            </span>
          </div>
          {land.verified && (
            <div className="absolute top-2 right-2">
              <span className="bg-green-600 text-white p-1.5 rounded-full flex items-center justify-center">
                <CheckCircle size={14} weight="fill" />
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                {land.title}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin size={14} weight="fill" />
                <span>{land.commune}, {land.region}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground whitespace-nowrap">
              {typeLabels[land.land_type]}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
            {land.description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <Ruler size={16} className="text-muted-foreground" />
                <span className="font-medium">{land.size?.toLocaleString()} m²</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(land.price / land.size).toLocaleString()} GNF/m²
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tag size={18} className="text-accent" weight="fill" />
              <span className="font-bold text-accent text-lg">
                {land.price?.toLocaleString()} GNF
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Card Component
const CompactCard = ({ land }) => {
  const navigate = useNavigate();
  
  const statusColors = {
    available: 'bg-primary',
    pending: 'bg-yellow-500',
    sold: 'bg-accent'
  };

  const defaultImage = 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=800&q=80';

  return (
    <div 
      className="bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group overflow-hidden"
      onClick={() => navigate(`/lands/${land.land_id}`)}
      data-testid={`land-compact-${land.land_id}`}
    >
      {/* Image */}
      <div className="relative h-28 sm:h-32 overflow-hidden">
        <img
          src={land.photos?.[0] || defaultImage}
          alt={land.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${statusColors[land.status]}`} />
        {land.verified && (
          <CheckCircle 
            size={16} 
            weight="fill" 
            className="absolute top-1 right-1 text-green-500 bg-white rounded-full" 
          />
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {land.title}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
          <MapPin size={10} weight="fill" />
          <span className="line-clamp-1">{land.commune}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{land.size?.toLocaleString()} m²</span>
          <span className="font-bold text-accent text-xs">
            {(land.price / 1000000).toFixed(0)}M
          </span>
        </div>
      </div>
    </div>
  );
};

// Table View Component
const TableView = ({ lands }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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

  const statusColors = {
    available: 'text-primary',
    pending: 'text-yellow-600',
    sold: 'text-accent'
  };

  return (
    <div className="overflow-x-auto border border-border rounded-lg" data-testid="table-view">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50">
          <tr>
            <th className="text-left p-3 font-semibold">Terrain</th>
            <th className="text-left p-3 font-semibold hidden sm:table-cell">Localisation</th>
            <th className="text-left p-3 font-semibold hidden md:table-cell">Type</th>
            <th className="text-right p-3 font-semibold">Surface</th>
            <th className="text-right p-3 font-semibold">Prix</th>
            <th className="text-right p-3 font-semibold hidden lg:table-cell">Prix/m²</th>
            <th className="text-center p-3 font-semibold">Statut</th>
            <th className="text-center p-3 font-semibold w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lands.map(land => (
            <tr 
              key={land.land_id}
              className="hover:bg-secondary/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/lands/${land.land_id}`)}
              data-testid={`table-row-${land.land_id}`}
            >
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={land.photos?.[0] || 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=100&q=60'}
                    alt=""
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div>
                    <div className="font-medium line-clamp-1 flex items-center gap-1">
                      {land.title}
                      {land.verified && <CheckCircle size={12} weight="fill" className="text-green-600" />}
                    </div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      {land.commune}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-3 hidden sm:table-cell">
                <div className="line-clamp-1">{land.commune}</div>
                <div className="text-xs text-muted-foreground">{land.region}</div>
              </td>
              <td className="p-3 hidden md:table-cell">
                <span className="px-2 py-0.5 bg-secondary text-xs rounded">
                  {typeLabels[land.land_type]}
                </span>
              </td>
              <td className="p-3 text-right font-medium">
                {land.size?.toLocaleString()} m²
              </td>
              <td className="p-3 text-right font-bold text-accent">
                {land.price?.toLocaleString()} GNF
              </td>
              <td className="p-3 text-right text-muted-foreground hidden lg:table-cell">
                {Math.round(land.price / land.size).toLocaleString()} GNF
              </td>
              <td className="p-3 text-center">
                <span className={`font-medium ${statusColors[land.status]}`}>
                  {statusLabels[land.status]}
                </span>
              </td>
              <td className="p-3 text-center">
                <CaretRight size={16} className="text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Map View Component
const MapView = ({ lands, selectedLand, setSelectedLand }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  // Calculate center from lands
  const validLands = lands.filter(l => l.latitude && l.longitude);
  const center = validLands.length > 0 ? {
    lat: validLands.reduce((sum, l) => sum + l.latitude, 0) / validLands.length,
    lng: validLands.reduce((sum, l) => sum + l.longitude, 0) / validLands.length
  } : { lat: 9.6412, lng: -13.6785 }; // Default to Conakry

  const statusColors = {
    available: '#133E26',
    pending: '#EAB308',
    sold: '#A0522D'
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px]" data-testid="map-view">
      {/* Map */}
      <div className="flex-1 h-full rounded-lg overflow-hidden border border-border">
        {MAPBOX_TOKEN ? (
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: center.lng,
              latitude: center.lat,
              zoom: 8
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {validLands.map(land => (
              <Marker
                key={land.land_id}
                longitude={land.longitude}
                latitude={land.latitude}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedLand(land);
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: statusColors[land.status] }}
                >
                  <MapPin size={16} weight="fill" className="text-white" />
                </div>
              </Marker>
            ))}

            {selectedLand && (
              <Popup
                longitude={selectedLand.longitude}
                latitude={selectedLand.latitude}
                onClose={() => setSelectedLand(null)}
                closeButton={true}
                closeOnClick={false}
                anchor="bottom"
                offset={20}
              >
                <div className="p-1 min-w-[200px]">
                  <img 
                    src={selectedLand.photos?.[0] || 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=200&q=60'}
                    alt=""
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <h3 className="font-bold text-sm line-clamp-1">{selectedLand.title}</h3>
                  <div className="text-xs text-gray-500">{selectedLand.commune}, {selectedLand.region}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs">{selectedLand.size?.toLocaleString()} m²</span>
                    <span className="font-bold text-accent text-sm">{selectedLand.price?.toLocaleString()} GNF</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => navigate(`/lands/${selectedLand.land_id}`)}
                  >
                    Voir détails
                    <CaretRight size={12} className="ml-1" />
                  </Button>
                </div>
              </Popup>
            )}
          </Map>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <p className="text-muted-foreground">Carte non disponible</p>
          </div>
        )}
      </div>

      {/* Sidebar List */}
      <div className="w-full lg:w-80 h-full overflow-y-auto space-y-2 pr-1">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {validLands.length} terrains sur la carte
        </div>
        {lands.map(land => (
          <div
            key={land.land_id}
            className={`p-2 border rounded cursor-pointer transition-all ${
              selectedLand?.land_id === land.land_id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => {
              setSelectedLand(land);
              if (mapRef.current && land.latitude && land.longitude) {
                mapRef.current.flyTo({
                  center: [land.longitude, land.latitude],
                  zoom: 12,
                  duration: 1000
                });
              }
            }}
          >
            <div className="flex gap-2">
              <img 
                src={land.photos?.[0] || 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=100&q=60'}
                alt=""
                className="w-16 h-16 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{land.title}</h4>
                <div className="text-xs text-muted-foreground">{land.commune}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs">{land.size?.toLocaleString()} m²</span>
                  <span className="font-bold text-accent text-xs">{(land.price / 1000000).toFixed(0)}M</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Listings() {
  const { t } = useTranslation();
  const [lands, setLands] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLand, setSelectedLand] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    land_type: '',
    status: '',
    min_price: '',
    max_price: '',
    min_size: '',
    max_size: ''
  });

  useEffect(() => {
    fetchRegions();
    fetchLands();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await fetch(`${API}/regions`);
      const data = await res.json();
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchLands = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.region && filters.region !== 'all') params.append('region', filters.region);
      if (filters.land_type && filters.land_type !== 'all') params.append('land_type', filters.land_type);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);

      const res = await fetch(`${API}/lands?${params}`);
      const data = await res.json();
      setLands(Array.isArray(data) ? data : data.lands || []);
    } catch (error) {
      console.error('Error fetching lands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLands();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      land_type: '',
      status: '',
      min_price: '',
      max_price: '',
      min_size: '',
      max_size: ''
    });
  };

  // Sort lands
  const sortedLands = [...lands].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return (a.price || 0) - (b.price || 0);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'size_asc': return (a.size || 0) - (b.size || 0);
      case 'size_desc': return (b.size || 0) - (a.size || 0);
      case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
      case 'newest':
      default: return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Render lands based on view mode
  const renderLands = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (sortedLands.length === 0) {
      return (
        <div className="text-center py-16 bg-card border border-border">
          <MapPin size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-4">{t('common.no_results')}</p>
          <Button variant="outline" onClick={clearFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      );
    }

    switch (viewMode) {
      case 'list':
        return (
          <div className="space-y-4">
            {sortedLands.map(land => (
              <ListViewCard key={land.land_id} land={land} />
            ))}
          </div>
        );
      
      case 'compact':
        return (
          <div className={`grid ${VIEW_MODES.compact.cols} gap-3`}>
            {sortedLands.map(land => (
              <CompactCard key={land.land_id} land={land} />
            ))}
          </div>
        );
      
      case 'table':
        return <TableView lands={sortedLands} />;
      
      case 'map':
        return <MapView lands={sortedLands} selectedLand={selectedLand} setSelectedLand={setSelectedLand} />;
      
      case 'grid':
      default:
        return (
          <div className={`grid ${VIEW_MODES.grid.cols} gap-6`}>
            {sortedLands.map(land => (
              <LandCard key={land.land_id} land={land} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="listings-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">{t('lands.title')}</h1>
          <p className="text-primary-foreground/80">
            Explorez tous les terrains disponibles en Guinée
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('lands.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                className="pl-10 h-12"
                data-testid="listings-search-input"
              />
            </div>
            <Button onClick={applyFilters} className="h-12 shadow-brutal-sm btn-hover-lift">
              <MagnifyingGlass className="w-5 h-5 mr-2" />
              {t('common.search')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 ${showFilters ? 'bg-secondary' : ''}`}
            >
              <Funnel className="w-5 h-5 mr-2" />
              {t('common.filter')}
              <CaretDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="p-6 bg-card border border-border animate-fade-in-up mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="form-label block mb-2">{t('lands.filter.region')}</label>
                  <Select value={filters.region} onValueChange={(v) => handleFilterChange('region', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('lands.filter.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('lands.filter.all')}</SelectItem>
                      {regions.map(r => (
                        <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="form-label block mb-2">{t('lands.filter.type')}</label>
                  <Select value={filters.land_type} onValueChange={(v) => handleFilterChange('land_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('lands.filter.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('lands.filter.all')}</SelectItem>
                      <SelectItem value="residential">{t('lands.type.residential')}</SelectItem>
                      <SelectItem value="commercial">{t('lands.type.commercial')}</SelectItem>
                      <SelectItem value="agricultural">{t('lands.type.agricultural')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="form-label block mb-2">Statut</label>
                  <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('lands.filter.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('lands.filter.all')}</SelectItem>
                      <SelectItem value="available">{t('lands.status.available')}</SelectItem>
                      <SelectItem value="pending">{t('lands.status.pending')}</SelectItem>
                      <SelectItem value="sold">{t('lands.status.sold')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="form-label block mb-2">{t('lands.filter.price')}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price}
                      onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price}
                      onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button onClick={applyFilters}>
                  {t('lands.filter.apply')}
                </Button>
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  {t('lands.filter.clear')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Results count, Sort, View modes */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          {/* Results count */}
          <div className="text-muted-foreground">
            <span className="font-bold text-foreground">{lands.length}</span> terrains trouvés
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <SortAscending size={18} className="text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View mode buttons */}
            <div className="flex border border-border rounded-lg overflow-hidden" data-testid="view-mode-selector">
              {Object.entries(VIEW_MODES).map(([mode, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 transition-colors ${
                      viewMode === mode 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card hover:bg-secondary'
                    }`}
                    title={config.label}
                    data-testid={`view-mode-${mode}`}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Land listings */}
        {renderLands()}
      </div>
    </div>
  );
}
