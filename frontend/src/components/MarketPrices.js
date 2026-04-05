import { useState, useEffect } from 'react';
import { MapPin, ArrowUp, ArrowDown, Minus, Buildings, Calendar } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Enhanced Price Comparison with Nearby Transactions
export const EnhancedPriceComparison = ({ landId }) => {
  const [comparison, setComparison] = useState(null);
  const [nearbyPrices, setNearbyPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reference'); // 'reference' or 'market'

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        // Fetch reference prices
        const refRes = await fetch(`${API}/prices/compare/${landId}`);
        if (refRes.ok) {
          setComparison(await refRes.json());
        }
        
        // Fetch nearby transaction prices
        const nearbyRes = await fetch(`${API}/prices/nearby/${landId}?radius_km=10`);
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
  }, [landId]);

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

        {/* Market Prices Tab - Nearby Transactions */}
        {activeTab === 'market' && hasMarketData && (
          <div className="space-y-4">
            {/* Market Statistics */}
            {nearbyPrices.market_statistics && (
              <div className="bg-secondary/30 p-3 rounded">
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
                  Basé sur {nearbyPrices.market_statistics.count} transaction(s) similaire(s)
                </div>
              </div>
            )}

            {/* Nearby Transactions List */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Terrains vendus à proximité</div>
              {nearbyPrices.nearby_transactions?.slice(0, 5).map((tx, idx) => (
                <div 
                  key={tx.transaction_id || idx}
                  className="flex items-center justify-between p-2 bg-secondary/20 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" weight="fill" />
                    <div>
                      <div className="font-medium line-clamp-1">{tx.land_title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{tx.commune}</span>
                        <span>•</span>
                        <span>{tx.distance_km} km</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-accent">{tx.price_per_m2?.toLocaleString()} GNF/m²</div>
                    <div className="text-xs text-muted-foreground">{tx.size?.toLocaleString()} m²</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Rayon de recherche: {nearbyPrices.search_radius_km} km
            </div>
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
