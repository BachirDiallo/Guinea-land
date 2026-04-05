import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendUp, 
  TrendDown, 
  Minus, 
  ChartLine, 
  Buildings,
  Calendar,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MarketTrends() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState(null);
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    region: 'all',
    commune: 'all',
    land_type: 'all',
    months: 12
  });

  useEffect(() => {
    fetch(`${API}/regions`)
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(console.error);
  }, []);

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

  // Simple bar chart visualization
  const maxPrice = trends?.trends?.length > 0 
    ? Math.max(...trends.trends.map(t => t.avg_price_per_m2)) 
    : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="market-trends-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <ChartLine className="w-8 h-8" weight="fill" />
            <h1 className="text-2xl sm:text-3xl font-black">
              Tendances du Marché
            </h1>
          </div>
          <p className="text-primary-foreground/80">
            Évolution des prix immobiliers en Guinée
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-card border border-border p-4 mb-6">
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
          <div className="bg-card border border-border p-12 text-center">
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
              {/* Trend Direction */}
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

              {/* Total Transactions */}
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

              {/* Total Volume */}
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
            <div className="bg-card border border-border p-6">
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
                          width: `${maxPrice > 0 ? (month.avg_price_per_m2 / maxPrice) * 100 : 0}%` 
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
      </div>
    </div>
  );
}
