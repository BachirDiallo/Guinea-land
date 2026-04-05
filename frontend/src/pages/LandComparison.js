import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { 
  Scales, 
  MapPin, 
  Ruler, 
  Tag, 
  CheckCircle,
  Trophy,
  X,
  Plus,
  Star
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandComparison() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [selectedLands, setSelectedLands] = useState([]);
  const [availableLands, setAvailableLands] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  // Get land IDs from URL
  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      setSelectedLands(ids.split(','));
    }
  }, [searchParams]);

  // Fetch available lands for selection
  useEffect(() => {
    fetch(`${API}/lands?status=available`)
      .then(res => res.json())
      .then(data => setAvailableLands(data))
      .catch(console.error);
  }, []);

  // Fetch comparison when lands selected
  useEffect(() => {
    if (selectedLands.length >= 2) {
      fetchComparison();
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
    if (selectedLands.length < 5 && !selectedLands.includes(landId)) {
      setSelectedLands([...selectedLands, landId]);
    }
    setShowSelector(false);
  };

  const removeLand = (landId) => {
    setSelectedLands(selectedLands.filter(id => id !== landId));
  };

  const isBestValue = (landId, metric) => {
    return comparison?.best_value?.[metric] === landId;
  };

  const statusColors = {
    available: 'bg-primary text-primary-foreground',
    pending: 'bg-yellow-500 text-black',
    sold: 'bg-accent text-accent-foreground'
  };

  const defaultImage = 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=400&q=80';

  return (
    <div className="min-h-screen bg-background" data-testid="land-comparison-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Scales className="w-8 h-8" weight="fill" />
            <h1 className="text-2xl sm:text-3xl font-black">
              Comparer les Terrains
            </h1>
          </div>
          <p className="text-primary-foreground/80">
            Comparez jusqu'à 5 terrains côte à côte
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selection Info */}
        <div className="bg-card border border-border p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="font-medium">{selectedLands.length}</span> terrain(s) sélectionné(s)
            {selectedLands.length < 2 && (
              <span className="text-muted-foreground ml-2">
                (minimum 2 pour comparer)
              </span>
            )}
          </div>
          <Button 
            onClick={() => setShowSelector(true)}
            disabled={selectedLands.length >= 5}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un terrain
          </Button>
        </div>

        {/* Land Selector Modal */}
        {showSelector && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden rounded-lg">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold">Sélectionner un terrain</h3>
                <button onClick={() => setShowSelector(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                {availableLands
                  .filter(l => !selectedLands.includes(l.land_id))
                  .map(land => (
                    <button
                      key={land.land_id}
                      onClick={() => addLand(land.land_id)}
                      className="w-full p-3 border border-border hover:border-primary text-left flex items-center gap-3 transition-colors"
                    >
                      <img 
                        src={land.photos?.[0] || defaultImage}
                        alt={land.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-1">{land.title}</div>
                        <div className="text-sm text-muted-foreground">{land.commune}, {land.region}</div>
                        <div className="text-sm font-bold text-accent">{land.price?.toLocaleString()} GNF</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : comparison ? (
          <>
            {/* Comparison Summary */}
            <div className="bg-accent/10 border border-accent p-4 mb-6 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-accent" weight="fill" />
                <span className="font-bold">Meilleurs choix</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Prix le plus bas:</span>
                  <div className="font-bold text-primary">
                    {comparison.lands.find(l => l.land_id === comparison.best_value.cheapest)?.title}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Plus grande surface:</span>
                  <div className="font-bold text-primary">
                    {comparison.lands.find(l => l.land_id === comparison.best_value.largest)?.title}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Meilleur prix/m²:</span>
                  <div className="font-bold text-primary">
                    {comparison.lands.find(l => l.land_id === comparison.best_value.best_price_per_m2)?.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparison.lands.length}, minmax(250px, 1fr))` }}>
                {comparison.lands.map((land) => (
                  <div key={land.land_id} className="bg-card border border-border overflow-hidden">
                    {/* Image */}
                    <div className="relative h-40">
                      <img 
                        src={land.photos?.[0] || defaultImage}
                        alt={land.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeLand(land.land_id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {land.verified && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" weight="fill" />
                          Vérifié
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <Link to={`/lands/${land.land_id}`} className="hover:text-primary">
                        <h3 className="font-bold line-clamp-2">{land.title}</h3>
                      </Link>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" weight="fill" />
                        {land.commune}, {land.region}
                      </div>

                      {/* Price */}
                      <div className={`p-2 rounded ${isBestValue(land.land_id, 'cheapest') ? 'bg-green-50 border border-green-200' : 'bg-secondary/30'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Prix</span>
                          {isBestValue(land.land_id, 'cheapest') && (
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">Moins cher</span>
                          )}
                        </div>
                        <div className="font-bold text-lg text-accent">
                          {land.price?.toLocaleString()} GNF
                        </div>
                      </div>

                      {/* Size */}
                      <div className={`p-2 rounded ${isBestValue(land.land_id, 'largest') ? 'bg-green-50 border border-green-200' : 'bg-secondary/30'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Surface</span>
                          {isBestValue(land.land_id, 'largest') && (
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">Plus grand</span>
                          )}
                        </div>
                        <div className="font-bold text-lg">
                          {land.size?.toLocaleString()} m²
                        </div>
                      </div>

                      {/* Price per m² */}
                      <div className={`p-2 rounded ${isBestValue(land.land_id, 'best_price_per_m2') ? 'bg-green-50 border border-green-200' : 'bg-secondary/30'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Prix/m²</span>
                          {isBestValue(land.land_id, 'best_price_per_m2') && (
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">Meilleur</span>
                          )}
                        </div>
                        <div className="font-bold text-lg">
                          {land.price_per_m2?.toLocaleString()} GNF
                        </div>
                      </div>

                      {/* Owner Rating */}
                      {land.owner_rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500" weight="fill" />
                          <span>{land.owner_rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">- {land.owner_name}</span>
                        </div>
                      )}

                      {/* Verifications */}
                      <div className="text-sm text-muted-foreground">
                        {land.verification_count} vérification(s)
                      </div>

                      {/* View Button */}
                      <Link to={`/lands/${land.land_id}`}>
                        <Button variant="outline" className="w-full">
                          Voir les détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Summary */}
            <div className="mt-6 bg-card border border-border p-4">
              <h3 className="font-bold mb-4">Résumé des métriques</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Prix</div>
                  <div className="text-sm">
                    <span className="font-bold">{comparison.metrics.price.min.toLocaleString()}</span>
                    <span className="text-muted-foreground"> - </span>
                    <span className="font-bold">{comparison.metrics.price.max.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">GNF</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Moy: {comparison.metrics.price.avg.toLocaleString()} GNF
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Surface</div>
                  <div className="text-sm">
                    <span className="font-bold">{comparison.metrics.size.min.toLocaleString()}</span>
                    <span className="text-muted-foreground"> - </span>
                    <span className="font-bold">{comparison.metrics.size.max.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">m²</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Moy: {comparison.metrics.size.avg.toLocaleString()} m²
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Prix/m²</div>
                  <div className="text-sm">
                    <span className="font-bold">{comparison.metrics.price_per_m2.min.toLocaleString()}</span>
                    <span className="text-muted-foreground"> - </span>
                    <span className="font-bold">{comparison.metrics.price_per_m2.max.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">GNF</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Moy: {comparison.metrics.price_per_m2.avg.toLocaleString()} GNF
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border p-12 text-center">
            <Scales className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-bold mb-2">Sélectionnez des terrains à comparer</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez au moins 2 terrains pour voir la comparaison
            </p>
            <Button onClick={() => setShowSelector(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un terrain
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
