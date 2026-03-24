import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LandMap } from '../components/LandMap';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Plus, X } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AddLand() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    size: '',
    region: '',
    commune: '',
    address: '',
    land_type: 'residential',
    latitude: null,
    longitude: null,
    photos: [],
    documents: []
  });

  useEffect(() => {
    fetchRegions();
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMapClick = (coords) => {
    setMarkerPosition(coords);
    setFormData(prev => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude
    }));
  };

  const handleAddPhoto = () => {
    const url = prompt('Entrez l\'URL de la photo:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, url]
      }));
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      toast.error('Veuillez sélectionner un emplacement sur la carte');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/lands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          size: parseFloat(formData.size)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erreur lors de la création');
      }

      const land = await res.json();
      toast.success('Terrain créé avec succès!');
      navigate(`/lands/${land.land_id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="add-land-page">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-black">{t('dashboard.add_land')}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-bold mb-4">Informations de base</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="form-label">{t('land.form.title')}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                      data-testid="land-title-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="form-label">{t('land.form.description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      required
                      data-testid="land-description-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="form-label">{t('land.form.price')}</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        required
                        data-testid="land-price-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size" className="form-label">{t('land.form.size')}</Label>
                      <Input
                        id="size"
                        type="number"
                        value={formData.size}
                        onChange={(e) => handleChange('size', e.target.value)}
                        required
                        data-testid="land-size-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="land_type" className="form-label">{t('land.form.type')}</Label>
                    <Select value={formData.land_type} onValueChange={(v) => handleChange('land_type', v)}>
                      <SelectTrigger data-testid="land-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">{t('lands.type.residential')}</SelectItem>
                        <SelectItem value="commercial">{t('lands.type.commercial')}</SelectItem>
                        <SelectItem value="agricultural">{t('lands.type.agricultural')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-bold mb-4">Localisation</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="region" className="form-label">{t('land.form.region')}</Label>
                    <Select value={formData.region} onValueChange={(v) => handleChange('region', v)}>
                      <SelectTrigger data-testid="land-region-select">
                        <SelectValue placeholder="Sélectionnez une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(r => (
                          <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="commune" className="form-label">{t('land.form.commune')}</Label>
                    <Input
                      id="commune"
                      value={formData.commune}
                      onChange={(e) => handleChange('commune', e.target.value)}
                      required
                      data-testid="land-commune-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="form-label">{t('land.form.address')}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      required
                      data-testid="land-address-input"
                    />
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="p-3 bg-secondary text-sm">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Coordonnées: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-bold mb-4">{t('land.form.photos')}</h2>
                
                <div className="space-y-4">
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative">
                          <img src={photo} alt="" className="w-full h-20 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={handleAddPhoto} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une photo (URL)
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full h-12 shadow-brutal-md btn-hover-lift"
                disabled={loading}
                data-testid="submit-land-btn"
              >
                {loading ? t('common.loading') : t('land.form.submit')}
              </Button>
            </div>

            {/* Right Column - Map */}
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-card border border-border p-4">
                <h2 className="font-bold mb-2">{t('land.form.location')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Cliquez sur la carte pour définir l'emplacement exact du terrain
                </p>
              </div>
              <div className="h-[500px] border border-border">
                <LandMap
                  lands={[]}
                  clickMode={true}
                  onMapClick={handleMapClick}
                  markerPosition={markerPosition}
                  height="100%"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
