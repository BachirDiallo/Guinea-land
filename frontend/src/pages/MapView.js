import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LandMap } from '../components/LandMap';
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
import { MagnifyingGlass, Funnel, X, List, GridFour } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MapView() {
  const { t } = useTranslation();
  const [lands, setLands] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list or grid
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    land_type: '',
    status: 'available',
    min_price: '',
    max_price: ''
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
      if (filters.region) params.append('region', filters.region);
      if (filters.land_type) params.append('land_type', filters.land_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);

      const res = await fetch(`${API}/lands?${params}`);
      const data = await res.json();
      setLands(data);
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
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      land_type: '',
      status: 'available',
      min_price: '',
      max_price: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="map-view">
      {/* Left Panel - List (collapsible on mobile) */}
      <div className={`w-full lg:w-[40%] flex flex-col bg-background border-r border-border ${
        showFilters ? 'max-h-[60vh] lg:max-h-none' : 'max-h-[40vh] lg:max-h-none'
      } lg:h-auto transition-all`}>
        {/* Search & Filters Header */}
        <div className="p-3 sm:p-4 border-b border-border sticky top-16 bg-background z-20">
          <div className="flex gap-2 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('lands.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                className="pl-9 sm:pl-10 h-10 sm:h-auto text-sm sm:text-base"
                data-testid="land-search-input"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 w-10 p-0 ${showFilters ? 'bg-secondary' : ''}`}
              data-testid="toggle-filters-btn"
            >
              <Funnel className="w-4 sm:w-5 h-4 sm:h-5" />
            </Button>
            <div className="hidden sm:flex border border-border">
              <Button 
                variant="ghost" 
                size="sm"
                className={viewMode === 'list' ? 'bg-secondary' : ''}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className={viewMode === 'grid' ? 'bg-secondary' : ''}
                onClick={() => setViewMode('grid')}
              >
                <GridFour className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border animate-fade-in-up">
              <Select value={filters.region} onValueChange={(v) => handleFilterChange('region', v)}>
                <SelectTrigger data-testid="region-filter" className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder={t('lands.filter.region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('lands.filter.all')}</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.land_type} onValueChange={(v) => handleFilterChange('land_type', v)}>
                <SelectTrigger data-testid="type-filter" className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder={t('lands.filter.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('lands.filter.all')}</SelectItem>
                  <SelectItem value="residential">{t('lands.type.residential')}</SelectItem>
                  <SelectItem value="commercial">{t('lands.type.commercial')}</SelectItem>
                  <SelectItem value="agricultural">{t('lands.type.agricultural')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger data-testid="status-filter" className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder={t('lands.filter.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('lands.filter.all')}</SelectItem>
                  <SelectItem value="available">{t('lands.status.available')}</SelectItem>
                  <SelectItem value="pending">{t('lands.status.pending')}</SelectItem>
                  <SelectItem value="sold">{t('lands.status.sold')}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 sm:gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  className="w-full h-9 sm:h-10 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  className="w-full h-9 sm:h-10 text-sm"
                />
              </div>

              <Button onClick={applyFilters} className="col-span-2 h-9 sm:h-10 text-sm" data-testid="apply-filters-btn">
                {t('lands.filter.apply')}
              </Button>
              <Button variant="ghost" onClick={clearFilters} className="col-span-2 h-9 sm:h-10 text-sm">
                <X className="w-4 h-4 mr-2" />
                {t('lands.filter.clear')}
              </Button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="px-3 sm:px-4 py-2 bg-secondary/50 text-xs sm:text-sm flex justify-between items-center">
          <span><span className="font-medium">{lands.length}</span> {t('lands.title').toLowerCase()}</span>
          <span className="text-muted-foreground lg:hidden">Glissez vers le haut pour la carte</span>
        </div>

        {/* Land List */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center h-32 sm:h-64">
              <div className="w-6 sm:w-8 h-6 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : lands.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
              {t('common.no_results')}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3 sm:gap-4' : 'space-y-3 sm:space-y-4'}>
              {lands.map(land => (
                <div 
                  key={land.land_id}
                  onClick={() => setSelectedLand(land)}
                  className={`cursor-pointer transition-all active:scale-[0.98] ${selectedLand?.land_id === land.land_id ? 'ring-2 ring-accent' : ''}`}
                >
                  <LandCard land={land} compact={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map (takes more space on mobile) */}
      <div className="w-full lg:w-[60%] h-[60vh] lg:h-screen lg:sticky lg:top-16 flex-1" style={{ minHeight: '60vh' }}>
        <LandMap 
          lands={lands}
          selectedLand={selectedLand}
          onLandSelect={setSelectedLand}
          height="60vh"
        />
      </div>
    </div>
  );
}
