import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/mapbox';
import { 
  MapPin, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Buildings, 
  Sliders,
  MapTrifold,
  ListBullets,
  CaretRight,
  Circle
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Enhanced Price Comparison with Nearby Transactions, Radius Selector & Map View
export const EnhancedPriceComparison = ({ landId, landLocation }) => {
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [nearbyPrices, setNearbyPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reference');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [radius, setRadius] = useState(5);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const mapRef = useRef(null);

  // Fetch data when radius changes
  useEffect(() => {
    const fetchPriceData = async () => {
      setLoading(true);
      try {
        // Fetch reference prices
        const refRes = await fetch(`${API}/prices/compare/${landId}`);
        if (refRes.ok) {
          setComparison(await refRes.json());
        }
        
        // Fetch nearby transaction prices with selected radius
        const nearbyRes = await fetch(`${API}/prices/nearby/${landId}?radius_km=${radius}`);
        if (nearbyRes.ok) {
          setNearbyPrices(await nearbyRes.json());
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchPriceData();
    }
  }, [landId, radius]);

  if (loading) {
    return (
      <div className="bg-card border border-border p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const hasReferenceData = comparison?.reference_available;
  const hasMarketData = nearbyPrices?.total_found > 0;

  if (!hasReferenceData && !hasMarketData) {
    return null;
  }

  const statusColors = {
    fair_market: 'text-green-600 bg-green-50 border-green-200',
    above_market: 'text-orange-600 bg-orange-50 border-orange-200',
    below_market: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const statusLabels = {
    fair_market: 'Prix du marché',
    above_market: 'Au-dessus du marché',
    below_market: 'En-dessous du marché'
  };

  const statusIcons = {
    fair_market: Minus,
    above_market: ArrowUp,
    below_market: ArrowDown
  };

  // Generate circle polygon for radius visualization
  const generateCircle = (center, radiusKm, points = 64) => {
    const coords = [];
    const distanceX = radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]); // Close the circle
    return coords;
  };

  const circleGeoJson = landLocation ? {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [generateCircle([landLocation.lng, landLocation.lat], radius)]
    }
  } : null;

  return (
    <div className="bg-card border border-border" data-testid="enhanced-price-comparison">
      {/* Tab Headers */}
      <div className="flex border-b border-border">
        {hasReferenceData && (
          <button
            onClick={() => setActiveTab('reference')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'reference'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 hover:bg-secondary'
            }`}
            data-testid="tab-reference"
          >
            Prix de référence
          </button>
        )}
        {hasMarketData && (
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'market'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 hover:bg-secondary'
            }`}
            data-testid="tab-market"
          >
            Ventes à proximité ({nearbyPrices.total_found})
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Reference Prices Tab */}
        {activeTab === 'reference' && hasReferenceData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Prix/m² de ce terrain</div>
                <div className="font-bold text-lg">{comparison.land_price_per_m2?.toLocaleString()} GNF</div>
              </div>
              <div>
                <div className="text-muted-foreground">Prix/m² de référence</div>
                <div className="font-bold text-lg">{comparison.reference?.price_per_m2_avg?.toLocaleString()} GNF</div>
              </div>
            </div>

            {comparison.price_assessment && (
              <div className={`p-3 rounded border text-center ${statusColors[comparison.price_assessment.status]}`}>
                {(() => {
                  const Icon = statusIcons[comparison.price_assessment.status];
                  return (
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-5 h-5" weight="bold" />
                      <span className="font-medium">
                        {statusLabels[comparison.price_assessment.status]}
                        {comparison.price_assessment.difference_percent !== 0 && (
                          <span className="ml-1">
                            ({comparison.price_assessment.difference_percent > 0 ? '+' : ''}{comparison.price_assessment.difference_percent}%)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Fourchette de référence: {comparison.reference?.price_per_m2_min?.toLocaleString()} - {comparison.reference?.price_per_m2_max?.toLocaleString()} GNF/m²
            </div>
          </div>
        )}

        {/* Market Prices Tab - Nearby Transactions with Radius & Map */}
        {activeTab === 'market' && hasMarketData && (
          <div className="space-y-4">
            {/* Radius Selector */}
            <div className="bg-secondary/30 p-3 rounded" data-testid="radius-selector">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Circle className="w-4 h-4" weight="fill" />
                  Rayon de recherche
                </div>
                <Select value={radius.toString()} onValueChange={(v) => setRadius(parseInt(v))}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 km</SelectItem>
                    <SelectItem value="2">2 km</SelectItem>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Slider
                value={[radius]}
                onValueChange={([v]) => setRadius(v)}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 gap-1"
                data-testid="view-list-btn"
              >
                <ListBullets className="w-4 h-4" />
                Liste
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex-1 gap-1"
                data-testid="view-map-btn"
              >
                <MapTrifold className="w-4 h-4" />
                Carte
              </Button>
            </div>

            {/* Market Statistics */}
            {nearbyPrices.market_statistics && (
              <div className="bg-primary/5 p-3 rounded border border-primary/20">
                <div className="text-sm font-medium mb-2">Statistiques du marché local</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground">Min</div>
                    <div className="font-bold">{nearbyPrices.market_statistics.min_price_per_m2?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Moyenne</div>
                    <div className="font-bold text-primary">{nearbyPrices.market_statistics.avg_price_per_m2?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max</div>
                    <div className="font-bold">{nearbyPrices.market_statistics.max_price_per_m2?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Basé sur {nearbyPrices.market_statistics.count} transaction(s) dans un rayon de {radius} km
                </div>
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && landLocation && MAPBOX_TOKEN && (
              <div className="h-64 rounded overflow-hidden border border-border" data-testid="nearby-map">
                <Map
                  ref={mapRef}
                  initialViewState={{
                    longitude: landLocation.lng,
                    latitude: landLocation.lat,
                    zoom: radius > 20 ? 9 : radius > 10 ? 10 : radius > 5 ? 11 : 12
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {/* Radius Circle */}
                  {circleGeoJson && (
                    <Source type="geojson" data={circleGeoJson}>
                      <Layer
                        type="fill"
                        paint={{
                          'fill-color': '#133E26',
                          'fill-opacity': 0.1
                        }}
                      />
                      <Layer
                        type="line"
                        paint={{
                          'line-color': '#133E26',
                          'line-width': 2,
                          'line-dasharray': [2, 2]
                        }}
                      />
                    </Source>
                  )}

                  {/* Current Land Marker (Star) */}
                  <Marker
                    longitude={landLocation.lng}
                    latitude={landLocation.lat}
                  >
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <MapPin className="w-5 h-5 text-white" weight="fill" />
                    </div>
                  </Marker>

                  {/* Nearby Transactions Markers */}
                  {nearbyPrices.nearby_transactions?.map((tx, idx) => (
                    tx.latitude && tx.longitude && (
                      <Marker
                        key={tx.transaction_id || idx}
                        longitude={tx.longitude}
                        latitude={tx.latitude}
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setSelectedTransaction(tx);
                        }}
                      >
                        <div 
                          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow cursor-pointer hover:scale-110 transition-transform"
                          title={`${tx.price_per_m2?.toLocaleString()} GNF/m²`}
                        >
                          <span className="text-[8px] text-white font-bold">{idx + 1}</span>
                        </div>
                      </Marker>
                    )
                  ))}

                  {/* Popup for selected transaction */}
                  {selectedTransaction && selectedTransaction.latitude && (
                    <Popup
                      longitude={selectedTransaction.longitude}
                      latitude={selectedTransaction.latitude}
                      onClose={() => setSelectedTransaction(null)}
                      closeButton={true}
                      closeOnClick={false}
                      anchor="bottom"
                    >
                      <div className="p-2 min-w-[180px]">
                        <div className="font-bold text-sm line-clamp-1">{selectedTransaction.land_title}</div>
                        <div className="text-xs text-gray-500">{selectedTransaction.commune}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500">Prix/m²</div>
                            <div className="font-bold text-accent">{selectedTransaction.price_per_m2?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Distance</div>
                            <div className="font-bold">{selectedTransaction.distance_km} km</div>
                          </div>
                        </div>
                        {selectedTransaction.land_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 h-7 text-xs"
                            onClick={() => navigate(`/lands/${selectedTransaction.land_id}`)}
                          >
                            Voir le terrain
                            <CaretRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </Popup>
                  )}
                </Map>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2" data-testid="nearby-list">
                <div className="text-sm font-medium">Terrains vendus à proximité</div>
                {nearbyPrices.nearby_transactions?.slice(0, 10).map((tx, idx) => (
                  <div 
                    key={tx.transaction_id || idx}
                    className="flex items-center justify-between p-2 bg-secondary/20 rounded text-sm hover:bg-secondary/40 cursor-pointer transition-colors"
                    onClick={() => tx.land_id && navigate(`/lands/${tx.land_id}`)}
                    data-testid={`nearby-item-${idx}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-white font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium line-clamp-1">{tx.land_title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{tx.commune}</span>
                          <span>•</span>
                          <span>{tx.distance_km} km</span>
                          <span>•</span>
                          <span>{tx.size?.toLocaleString()} m²</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-accent">{tx.price_per_m2?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">GNF/m²</div>
                    </div>
                  </div>
                ))}
                
                {nearbyPrices.nearby_transactions?.length > 10 && (
                  <div className="text-xs text-center text-muted-foreground">
                    +{nearbyPrices.nearby_transactions.length - 10} autres terrains
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Market Analysis Component for Region/Commune
export const MarketAnalysis = ({ region, commune, landType }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        let url = `${API}/prices/market-analysis?months=${months}`;
        if (region) url += `&region=${encodeURIComponent(region)}`;
        if (commune) url += `&commune=${encodeURIComponent(commune)}`;
        if (landType) url += `&land_type=${encodeURIComponent(landType)}`;
        
        const res = await fetch(url);
        if (res.ok) {
          setAnalysis(await res.json());
        }
      } catch (error) {
        console.error('Error fetching market analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [region, commune, landType, months]);

  if (loading) {
    return (
      <div className="bg-card border border-border p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!analysis || analysis.total_transactions === 0) {
    return (
      <div className="bg-card border border-border p-6 text-center text-muted-foreground">
        <Buildings className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Aucune donnée de marché disponible pour cette zone</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6" data-testid="market-analysis">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Analyse du marché</h3>
        <select
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value))}
          className="text-sm border border-border rounded px-2 py-1"
        >
          <option value={6}>6 mois</option>
          <option value={12}>12 mois</option>
          <option value={24}>24 mois</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-secondary/30 p-3 rounded text-center">
          <div className="text-2xl font-bold text-primary">{analysis.total_transactions}</div>
          <div className="text-xs text-muted-foreground">Transactions</div>
        </div>
        <div className="bg-secondary/30 p-3 rounded text-center">
          <div className="text-2xl font-bold">{analysis.statistics?.avg_price_per_m2?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">GNF/m² moyen</div>
        </div>
        <div className="bg-secondary/30 p-3 rounded text-center">
          <div className="text-2xl font-bold">{analysis.statistics?.median_price_per_m2?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">GNF/m² médian</div>
        </div>
        <div className="bg-secondary/30 p-3 rounded text-center">
          <div className="text-2xl font-bold">{analysis.statistics?.avg_land_size?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">m² moyen</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Min: {analysis.statistics?.min_price_per_m2?.toLocaleString()} GNF/m²</span>
        <span>Max: {analysis.statistics?.max_price_per_m2?.toLocaleString()} GNF/m²</span>
      </div>

      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
        Volume total: {analysis.statistics?.total_volume_gnf?.toLocaleString()} GNF sur {months} mois
      </div>
    </div>
  );
};

export default { EnhancedPriceComparison, MarketAnalysis };
