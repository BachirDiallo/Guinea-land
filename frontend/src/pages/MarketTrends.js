import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import { 
  TrendUp, 
  TrendDown, 
  Minus, 
  ChartLine, 
  Buildings,
  Calendar,
  CurrencyCircleDollar,
  MapPin,
  Users,
  Star,
  ShieldCheck,
  CaretRight,
  Phone,
  Trophy,
  Medal,
  Crown
} from '@phosphor-icons/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Guinea center coordinates
const GUINEA_CENTER = {
  longitude: -10.9408,
  latitude: 10.7,
  zoom: 6.5
};

export default function MarketTrends() {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState(null);
  const [regions, setRegions] = useState([]);
  const [regionalStats, setRegionalStats] = useState(null);
  const [communeStats, setCommuneStats] = useState(null);
  const [topSellers, setTopSellers] = useState(null);
  const [officials, setOfficials] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [filters, setFilters] = useState({
    region: 'all',
    commune: 'all',
    land_type: 'all',
    months: 12
  });

  // Fetch regions
  useEffect(() => {
    fetch(`${API}/regions`)
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(console.error);
  }, []);

  // Fetch regional stats for map
  useEffect(() => {
    fetch(`${API}/market/regional-stats`)
      .then(res => res.json())
      .then(data => setRegionalStats(data))
      .catch(console.error);
  }, []);

  // Fetch trends
  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        let url = `${API}/market/trends?months=${filters.months}`;
        if (filters.region && filters.region !== 'all') url += `&region=${encodeURIComponent(filters.region)}`;
        if (filters.commune && filters.commune !== 'all') url += `&commune=${encodeURIComponent(filters.commune)}`;
        if (filters.land_type && filters.land_type !== 'all') url += `&land_type=${encodeURIComponent(filters.land_type)}`;
        
        const res = await fetch(url);
        if (res.ok) {
          setTrends(await res.json());
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [filters]);

  // Fetch commune stats when region is selected
  useEffect(() => {
    if (selectedRegion) {
      fetch(`${API}/market/commune-stats/${encodeURIComponent(selectedRegion)}`)
        .then(res => res.json())
        .then(data => setCommuneStats(data))
        .catch(console.error);
      
      // Also fetch top sellers for region
      fetch(`${API}/market/top-sellers?region=${encodeURIComponent(selectedRegion)}`)
        .then(res => res.json())
        .then(data => setTopSellers(data))
        .catch(console.error);
    }
  }, [selectedRegion]);

  // Fetch officials
  useEffect(() => {
    fetch(`${API}/market/officials`)
      .then(res => res.json())
      .then(data => setOfficials(data))
      .catch(console.error);
  }, []);

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up': return <TrendUp className="w-6 h-6 text-green-600" weight="bold" />;
      case 'down': return <TrendDown className="w-6 h-6 text-red-600" weight="bold" />;
      default: return <Minus className="w-6 h-6 text-gray-500" weight="bold" />;
    }
  };

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendLabel = (direction) => {
    switch (direction) {
      case 'up': return 'En hausse';
      case 'down': return 'En baisse';
      case 'stable': return 'Stable';
      default: return 'Données insuffisantes';
    }
  };

  const getMarkerSize = (transactions) => {
    if (transactions > 20) return 50;
    if (transactions > 10) return 40;
    if (transactions > 5) return 35;
    return 28;
  };

  const getMarkerColor = (avgPrice, maxPrice) => {
    if (!maxPrice || maxPrice === 0) return '#6B7280';
    const ratio = avgPrice / maxPrice;
    if (ratio > 0.7) return '#DC2626'; // High price - red
    if (ratio > 0.4) return '#F59E0B'; // Medium - orange
    return '#10B981'; // Low - green
  };

  const handleRegionClick = (region) => {
    setSelectedRegion(region.region);
    setFilters(prev => ({ ...prev, region: region.region, commune: 'all' }));
    
    // Fly to region
    if (mapRef.current && region.center) {
      mapRef.current.flyTo({
        center: [region.center.lng, region.center.lat],
        zoom: 8,
        duration: 1500
      });
    }
  };

  const maxPrice = regionalStats?.regions 
    ? Math.max(...regionalStats.regions.map(r => r.avg_price_per_m2).filter(p => p > 0))
    : 0;

  // Simple bar chart visualization for trends
  const maxTrendPrice = trends?.trends?.length > 0 
    ? Math.max(...trends.trends.map(t => t.avg_price_per_m2)) 
    : 0;

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" weight="fill" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" weight="fill" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" weight="fill" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background" data-testid="market-trends-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <ChartLine className="w-8 h-8" weight="fill" />
            <h1 className="text-2xl sm:text-3xl font-black">
              Tendances du Marché
            </h1>
          </div>
          <p className="text-primary-foreground/80">
            Analyse interactive du marché immobilier guinéen
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="map" className="gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Carte</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <ChartLine className="w-4 h-4" />
              <span className="hidden sm:inline">Évolution</span>
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Top Vendeurs</span>
            </TabsTrigger>
            <TabsTrigger value="officials" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Officiels</span>
            </TabsTrigger>
          </TabsList>

          {/* MAP TAB */}
          <TabsContent value="map" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Map */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="h-[500px]">
                    {MAPBOX_TOKEN ? (
                      <Map
                        ref={mapRef}
                        initialViewState={GUINEA_CENTER}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        mapboxAccessToken={MAPBOX_TOKEN}
                      >
                        {/* Region markers */}
                        {regionalStats?.regions?.map((region) => (
                          <Marker
                            key={region.code}
                            longitude={region.center?.lng || 0}
                            latitude={region.center?.lat || 0}
                            onClick={() => handleRegionClick(region)}
                          >
                            <div
                              className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
                                selectedRegion === region.region ? 'scale-110' : ''
                              }`}
                              onMouseEnter={() => setHoveredRegion(region)}
                              onMouseLeave={() => setHoveredRegion(null)}
                              style={{
                                width: getMarkerSize(region.total_transactions),
                                height: getMarkerSize(region.total_transactions),
                                borderRadius: '50%',
                                backgroundColor: getMarkerColor(region.avg_price_per_m2, maxPrice),
                                border: selectedRegion === region.region ? '3px solid #133E26' : '2px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '11px'
                              }}
                            >
                              {region.total_transactions}
                            </div>
                          </Marker>
                        ))}

                        {/* Hover popup */}
                        {hoveredRegion && (
                          <Popup
                            longitude={hoveredRegion.center?.lng || 0}
                            latitude={hoveredRegion.center?.lat || 0}
                            closeButton={false}
                            closeOnClick={false}
                            anchor="bottom"
                            offset={25}
                          >
                            <div className="p-2 min-w-[200px]">
                              <div className="font-bold text-lg">{hoveredRegion.region}</div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>
                                  <div className="text-gray-500">Terrains</div>
                                  <div className="font-bold">{hoveredRegion.total_lands}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Transactions</div>
                                  <div className="font-bold">{hoveredRegion.total_transactions}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-gray-500">Prix moyen/m²</div>
                                  <div className="font-bold text-accent">
                                    {hoveredRegion.avg_price_per_m2?.toLocaleString() || 'N/A'} GNF
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 mt-2">
                                Cliquez pour voir les détails
                              </div>
                            </div>
                          </Popup>
                        )}
                      </Map>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-secondary">
                        <p className="text-muted-foreground">Carte non disponible</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Legend */}
                  <div className="p-4 border-t border-border bg-secondary/30">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Prix:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Bas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>Moyen</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Élevé</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        Taille = nombre de transactions
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Region Details */}
              <div className="space-y-4">
                {/* Selected Region Info */}
                {selectedRegion ? (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{selectedRegion}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRegion(null);
                          setFilters(prev => ({ ...prev, region: 'all' }));
                          setCommuneStats(null);
                          mapRef.current?.flyTo({
                            center: [GUINEA_CENTER.longitude, GUINEA_CENTER.latitude],
                            zoom: GUINEA_CENTER.zoom,
                            duration: 1000
                          });
                        }}
                      >
                        Réinitialiser
                      </Button>
                    </div>

                    {/* Region summary */}
                    {regionalStats?.regions?.find(r => r.region === selectedRegion) && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {(() => {
                          const region = regionalStats.regions.find(r => r.region === selectedRegion);
                          return (
                            <>
                              <div className="bg-secondary/50 p-3 rounded text-center">
                                <div className="text-2xl font-bold">{region.total_lands}</div>
                                <div className="text-xs text-muted-foreground">Terrains</div>
                              </div>
                              <div className="bg-secondary/50 p-3 rounded text-center">
                                <div className="text-2xl font-bold">{region.total_transactions}</div>
                                <div className="text-xs text-muted-foreground">Transactions</div>
                              </div>
                              <div className="col-span-2 bg-accent/10 p-3 rounded text-center">
                                <div className="text-xl font-bold text-accent">
                                  {region.avg_price_per_m2?.toLocaleString()} GNF/m²
                                </div>
                                <div className="text-xs text-muted-foreground">Prix moyen</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Communes breakdown */}
                    {communeStats && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Communes</h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                          {communeStats.communes?.slice(0, 10).map((commune, idx) => (
                            <div 
                              key={commune.commune}
                              className="flex items-center justify-between p-2 bg-secondary/30 rounded text-sm cursor-pointer hover:bg-secondary/50"
                              onClick={() => setFilters(prev => ({ ...prev, commune: commune.commune }))}
                            >
                              <div>
                                <div className="font-medium">{commune.commune}</div>
                                <div className="text-xs text-muted-foreground">
                                  {commune.available_lands} terrains • {commune.total_transactions} ventes
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-accent">
                                  {commune.avg_price_per_m2?.toLocaleString() || '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">GNF/m²</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <h3 className="font-bold mb-1">Sélectionnez une région</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur un marqueur sur la carte pour voir les statistiques détaillées
                    </p>
                  </div>
                )}

                {/* All regions summary */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-bold mb-3">Aperçu national</h4>
                  <div className="space-y-2">
                    {regionalStats?.regions?.sort((a, b) => b.total_transactions - a.total_transactions).slice(0, 5).map((region, idx) => (
                      <div 
                        key={region.code}
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-secondary/30 p-2 rounded -mx-2"
                        onClick={() => handleRegionClick(region)}
                      >
                        <div className="flex items-center gap-2">
                          {getRankIcon(idx)}
                          <span className={selectedRegion === region.region ? 'font-bold' : ''}>
                            {region.region}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {region.total_transactions} ventes
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TRENDS TAB */}
          <TabsContent value="trends" className="mt-6">
            {/* Filters */}
            <div className="bg-card border border-border p-4 mb-6 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select 
                  value={filters.region} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, region: v, commune: 'all' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map(r => (
                      <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.land_type} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, land_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="residential">Résidentiel</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="agricultural">Agricole</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.months.toString()} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, months: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">12 mois</SelectItem>
                    <SelectItem value="24">24 mois</SelectItem>
                    <SelectItem value="36">36 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !trends || trends.trends?.length === 0 ? (
              <div className="bg-card border border-border p-12 text-center rounded-lg">
                <Buildings className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold mb-2">Aucune donnée disponible</h3>
                <p className="text-muted-foreground">
                  Pas assez de transactions pour afficher les tendances
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className={`p-6 border rounded-lg ${getTrendColor(trends.summary?.trend_direction)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium opacity-80">Tendance</div>
                        <div className="text-2xl font-bold">
                          {getTrendLabel(trends.summary?.trend_direction)}
                        </div>
                        {trends.summary?.change_percent !== 0 && (
                          <div className="text-sm mt-1">
                            {trends.summary?.change_percent > 0 ? '+' : ''}{trends.summary?.change_percent}%
                          </div>
                        )}
                      </div>
                      {getTrendIcon(trends.summary?.trend_direction)}
                    </div>
                  </div>

                  <div className="bg-card border border-border p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Transactions</div>
                        <div className="text-2xl font-bold">{trends.summary?.total_transactions}</div>
                        <div className="text-sm text-muted-foreground">
                          sur {filters.months} mois
                        </div>
                      </div>
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div className="bg-card border border-border p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Volume total</div>
                        <div className="text-2xl font-bold">
                          {(trends.summary?.total_volume / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-muted-foreground">GNF</div>
                      </div>
                      <CurrencyCircleDollar className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                </div>

                {/* Price Chart */}
                <div className="bg-card border border-border p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-6">Prix moyen par m² (GNF)</h3>
                  
                  <div className="space-y-3">
                    {trends.trends.map((month, idx) => (
                      <div key={month.month} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-muted-foreground font-mono">
                          {month.month}
                        </div>
                        <div className="flex-1 h-8 bg-secondary/30 rounded overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ 
                              width: `${maxTrendPrice > 0 ? (month.avg_price_per_m2 / maxTrendPrice) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <div className="w-32 text-right">
                          <span className="font-bold">{month.avg_price_per_m2.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">GNF/m²</span>
                        </div>
                        <div className="w-16 text-right text-sm text-muted-foreground">
                          ({month.transaction_count})
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                    Nombre entre parenthèses = nombre de transactions du mois
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* TOP SELLERS TAB */}
          <TabsContent value="sellers" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Region filter for sellers */}
              <div className="md:col-span-2">
                <Select 
                  value={selectedRegion || 'all'} 
                  onValueChange={(v) => setSelectedRegion(v === 'all' ? null : v)}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map(r => (
                      <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Top Sellers List */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Vendeurs
                </h3>
                
                {topSellers?.top_sellers?.length > 0 ? (
                  <div className="space-y-3">
                    {topSellers.top_sellers.map((seller, idx) => (
                      <div 
                        key={seller.user_id}
                        className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getRankIcon(idx)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{seller.name}</span>
                            {seller.verified && (
                              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" weight="fill" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{seller.role}</span>
                            {seller.avg_rating > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" weight="fill" />
                                  {seller.avg_rating}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold">{seller.total_sales}</div>
                          <div className="text-xs text-muted-foreground">ventes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun vendeur trouvé</p>
                  </div>
                )}
              </div>

              {/* Top by Volume */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CurrencyCircleDollar className="w-5 h-5 text-accent" />
                  Top Volume (GNF)
                </h3>
                
                {topSellers?.top_sellers?.length > 0 ? (
                  <div className="space-y-3">
                    {[...topSellers.top_sellers]
                      .sort((a, b) => b.total_volume - a.total_volume)
                      .slice(0, 10)
                      .map((seller, idx) => (
                        <div 
                          key={seller.user_id}
                          className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            {getRankIcon(idx)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{seller.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {seller.total_sales} ventes
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-accent">
                              {(seller.total_volume / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-muted-foreground">GNF</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CurrencyCircleDollar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune donnée</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* OFFICIALS TAB */}
          <TabsContent value="officials" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" weight="fill" />
                Utilisateurs Vérifiés & Officiels
              </h3>
              
              {officials?.officials?.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {officials.officials.map((official) => (
                    <div 
                      key={official.user_id}
                      className="p-4 bg-secondary/30 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold">{official.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {official.role}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-xs text-primary">
                          <ShieldCheck className="w-3 h-3" weight="fill" />
                          Vérifié
                        </div>
                      </div>
                      
                      {official.verification_level && official.verification_level !== 'standard' && (
                        <div className="text-xs bg-accent/10 text-accent px-2 py-1 rounded inline-block mb-2 capitalize">
                          {official.verification_level.replace('_', ' ')}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <div className="text-muted-foreground text-xs">Terrains vérifiés</div>
                          <div className="font-medium">{official.verified_lands_count}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Transactions</div>
                          <div className="font-medium">{official.transaction_count}</div>
                        </div>
                      </div>
                      
                      {official.phone && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <a 
                            href={`tel:${official.phone}`}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Phone className="w-4 h-4" />
                            {official.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Aucun utilisateur vérifié</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
