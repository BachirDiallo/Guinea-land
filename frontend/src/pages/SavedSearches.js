import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  MagnifyingGlass, 
  FloppyDisk, 
  Trash, 
  Play,
  Bell,
  BellSlash,
  Plus
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SavedSearches() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [showNewSearch, setShowNewSearch] = useState(false);
  const [newSearch, setNewSearch] = useState({
    name: '',
    search: '',
    region: '',
    commune: '',
    land_type: '',
    status: '',
    min_price: '',
    max_price: '',
    min_size: '',
    max_size: '',
    verified_only: false,
    notify_new_matches: false
  });

  useEffect(() => {
    fetchSavedSearches();
    fetch(`${API}/regions`)
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(console.error);
  }, [token]);

  const fetchSavedSearches = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API}/searches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedSearches(await res.json());
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!newSearch.name.trim()) {
      toast.error('Veuillez donner un nom à votre recherche');
      return;
    }

    try {
      // Convert "all" values to empty strings for the API
      const searchData = {
        ...newSearch,
        region: newSearch.region === 'all' ? '' : newSearch.region,
        land_type: newSearch.land_type === 'all' ? '' : newSearch.land_type,
      };
      
      const res = await fetch(`${API}/searches/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(searchData)
      });

      if (res.ok) {
        toast.success('Recherche sauvegardée!');
        setShowNewSearch(false);
        setNewSearch({
          name: '',
          search: '',
          region: '',
          commune: '',
          land_type: '',
          status: '',
          min_price: '',
          max_price: '',
          min_size: '',
          max_size: '',
          verified_only: false,
          notify_new_matches: false
        });
        fetchSavedSearches();
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSearch = async (searchId) => {
    try {
      const res = await fetch(`${API}/searches/${searchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Recherche supprimée');
        fetchSavedSearches();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const executeSearch = (search) => {
    const params = new URLSearchParams();
    const filters = search.filters || {};
    
    if (filters.search) params.set('search', filters.search);
    if (filters.region) params.set('region', filters.region);
    if (filters.land_type) params.set('type', filters.land_type);
    if (filters.status) params.set('status', filters.status);
    if (filters.min_price) params.set('min_price', filters.min_price);
    if (filters.max_price) params.set('max_price', filters.max_price);
    
    navigate(`/listings?${params.toString()}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MagnifyingGlass className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground">
            Connectez-vous pour sauvegarder vos recherches
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="saved-searches-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MagnifyingGlass className="w-8 h-8" weight="fill" />
                <h1 className="text-2xl sm:text-3xl font-black">
                  Mes Recherches Sauvegardées
                </h1>
              </div>
              <p className="text-primary-foreground/80">
                Retrouvez vos critères de recherche favoris
              </p>
            </div>
            <Dialog open={showNewSearch} onOpenChange={setShowNewSearch}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle recherche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une recherche sauvegardée</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Nom de la recherche *</Label>
                    <Input
                      value={newSearch.name}
                      onChange={(e) => setNewSearch(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Terrains à Conakry"
                    />
                  </div>

                  <div>
                    <Label>Mots-clés</Label>
                    <Input
                      value={newSearch.search}
                      onChange={(e) => setNewSearch(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Rechercher dans le titre/description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Région</Label>
                      <Select 
                        value={newSearch.region} 
                        onValueChange={(v) => setNewSearch(prev => ({ ...prev, region: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {regions.map(r => (
                            <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={newSearch.land_type} 
                        onValueChange={(v) => setNewSearch(prev => ({ ...prev, land_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="residential">Résidentiel</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="agricultural">Agricole</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prix min (GNF)</Label>
                      <Input
                        type="number"
                        value={newSearch.min_price}
                        onChange={(e) => setNewSearch(prev => ({ ...prev, min_price: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Prix max (GNF)</Label>
                      <Input
                        type="number"
                        value={newSearch.max_price}
                        onChange={(e) => setNewSearch(prev => ({ ...prev, max_price: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Surface min (m²)</Label>
                      <Input
                        type="number"
                        value={newSearch.min_size}
                        onChange={(e) => setNewSearch(prev => ({ ...prev, min_size: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Surface max (m²)</Label>
                      <Input
                        type="number"
                        value={newSearch.max_size}
                        onChange={(e) => setNewSearch(prev => ({ ...prev, max_size: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSearch.verified_only}
                        onChange={(e) => setNewSearch(prev => ({ ...prev, verified_only: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">Terrains vérifiés uniquement</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSearch.notify_new_matches}
                        onChange={(e) => setNewSearch(prev => ({ ...prev, notify_new_matches: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">Notifier les nouveaux résultats</span>
                    </label>
                  </div>

                  <Button onClick={handleSaveSearch} className="w-full gap-2">
                    <FloppyDisk className="w-4 h-4" />
                    Sauvegarder la recherche
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : savedSearches.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center">
            <MagnifyingGlass className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-bold mb-2">Aucune recherche sauvegardée</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première recherche pour retrouver facilement vos critères favoris
            </p>
            <Button onClick={() => setShowNewSearch(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Créer une recherche
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div 
                key={search.search_id}
                className="bg-card border border-border p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{search.name}</h3>
                    {search.notify_new_matches && (
                      <Bell className="w-4 h-4 text-primary" weight="fill" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                    {search.filters?.region && (
                      <span className="bg-secondary px-2 py-0.5 rounded">{search.filters.region}</span>
                    )}
                    {search.filters?.land_type && (
                      <span className="bg-secondary px-2 py-0.5 rounded">{search.filters.land_type}</span>
                    )}
                    {search.filters?.min_price && (
                      <span className="bg-secondary px-2 py-0.5 rounded">≥{parseInt(search.filters.min_price).toLocaleString()} GNF</span>
                    )}
                    {search.filters?.max_price && (
                      <span className="bg-secondary px-2 py-0.5 rounded">≤{parseInt(search.filters.max_price).toLocaleString()} GNF</span>
                    )}
                    {search.filters?.verified_only && (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Vérifiés</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Créée le {new Date(search.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => executeSearch(search)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Exécuter
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteSearch(search.search_id)}
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
