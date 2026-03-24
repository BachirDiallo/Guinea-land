import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { MagnifyingGlass, Funnel, X, CaretDown } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Listings() {
  const { t } = useTranslation();
  const [lands, setLands] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    land_type: '',
    status: '',
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
      if (filters.region && filters.region !== 'all') params.append('region', filters.region);
      if (filters.land_type && filters.land_type !== 'all') params.append('land_type', filters.land_type);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
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
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      land_type: '',
      status: '',
      min_price: '',
      max_price: ''
    });
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
        <div className="mb-8">
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
            <div className="p-6 bg-card border border-border animate-fade-in-up">
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

        {/* Results count */}
        <div className="mb-6 text-muted-foreground">
          <span className="font-bold text-foreground">{lands.length}</span> terrains trouvés
        </div>

        {/* Land Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : lands.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border">
            <p className="text-muted-foreground text-lg mb-4">{t('common.no_results')}</p>
            <Button variant="outline" onClick={clearFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lands.map(land => (
              <LandCard key={land.land_id} land={land} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
