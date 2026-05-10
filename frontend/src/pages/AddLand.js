import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, MapPin, Plus, X, Upload, FileText, Image as ImageIcon, Trash, Sparkle } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AddLand() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [drawingMode, setDrawingMode] = useState(false);

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
    boundaries: [],
    photos: [],
    documents: []
  });

  const [uploadedFiles, setUploadedFiles] = useState({
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

  // AI Description Generator
  const generateAIDescription = async () => {
    // Validate required fields
    if (!formData.region || !formData.commune || !formData.size) {
      toast.error('Veuillez d\'abord remplir la région, la commune et la surface');
      return;
    }

    setGeneratingDescription(true);
    
    try {
      const res = await fetch(`${API}/ai/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          size: parseFloat(formData.size) || 0,
          region: formData.region,
          commune: formData.commune,
          land_type: formData.land_type,
          address: formData.address,
          price: parseFloat(formData.price) || 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, description: data.description }));
        toast.success('Description générée par IA!');
      } else {
        throw new Error('Erreur lors de la génération');
      }
    } catch (error) {
      console.error('AI Description error:', error);
      toast.error('Impossible de générer la description. Réessayez.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleMapClick = useCallback((coords) => {
    if (drawingMode) {
      // Add boundary point
      const newPoint = [coords.longitude, coords.latitude];
      setBoundaryPoints(prev => [...prev, newPoint]);
    } else {
      // Set marker position
      setMarkerPosition(coords);
      setFormData(prev => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude
      }));
    }
  }, [drawingMode]);

  const handleFileUpload = async (file, fileType) => {
    const isPhoto = fileType === 'photo';
    isPhoto ? setUploadingPhoto(true) : setUploadingDoc(true);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch(`${API}/upload?file_type=${fileType}`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await res.json();
      
      // Add to uploaded files list
      setUploadedFiles(prev => ({
        ...prev,
        [isPhoto ? 'photos' : 'documents']: [
          ...prev[isPhoto ? 'photos' : 'documents'],
          {
            file_id: result.file_id,
            name: result.original_filename,
            url: `${API}/files/${result.file_id}`
          }
        ]
      }));

      // Add URL to form data
      setFormData(prev => ({
        ...prev,
        [isPhoto ? 'photos' : 'documents']: [
          ...prev[isPhoto ? 'photos' : 'documents'],
          `${API}/files/${result.file_id}`
        ]
      }));

      toast.success(`${isPhoto ? 'Photo' : 'Document'} téléchargé avec succès!`);
    } catch (error) {
      toast.error(error.message || 'Erreur lors du téléchargement');
    } finally {
      isPhoto ? setUploadingPhoto(false) : setUploadingDoc(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, 'photo');
    }
    e.target.value = '';
  };

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, 'document');
    }
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setUploadedFiles(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const removeDocument = (index) => {
    setUploadedFiles(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const clearBoundary = () => {
    setBoundaryPoints([]);
    setFormData(prev => ({ ...prev, boundaries: [] }));
  };

  const finishBoundary = () => {
    if (boundaryPoints.length >= 3) {
      // Close the polygon by adding the first point at the end
      const closedBoundary = [...boundaryPoints, boundaryPoints[0]];
      setFormData(prev => ({ ...prev, boundaries: closedBoundary }));
      setDrawingMode(false);
      toast.success('Délimitation enregistrée!');
    } else {
      toast.error('Minimum 3 points requis pour définir une délimitation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      toast.error('Veuillez sélectionner un emplacement sur la carte');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        size: parseFloat(formData.size),
        boundaries: boundaryPoints.length >= 3 ? [...boundaryPoints, boundaryPoints[0]] : []
      };

      const res = await fetch(`${API}/lands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erreur lors de la création');
      }

      const land = await res.json();
      toast.success('Terrain créé avec succès! En attente de vérification.');
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
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="description" className="form-label">{t('land.form.description')}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateAIDescription}
                        disabled={generatingDescription}
                        className="gap-1.5 text-xs h-7 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary hover:bg-primary/20"
                        data-testid="ai-generate-description-btn"
                      >
                        {generatingDescription ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Sparkle className="w-3.5 h-3.5" weight="fill" />
                            Générer avec IA
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      required
                      placeholder="Décrivez votre terrain ou utilisez l'IA pour générer une description..."
                      data-testid="land-description-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Astuce: Remplissez d'abord la région, commune et surface, puis cliquez sur "Générer avec IA"
                    </p>
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

              {/* Photos Upload */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  {t('land.form.photos')}
                </h2>
                
                <div className="space-y-4">
                  {uploadedFiles.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedFiles.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={photo.url} 
                            alt={photo.name} 
                            className="w-full h-24 object-cover border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="text-xs truncate block mt-1">{photo.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                      data-testid="photo-upload-input"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => document.getElementById('photo-upload').click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Ajouter une photo
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: JPG, PNG, GIF, WebP. Max 10MB par fichier.
                  </p>
                </div>
              </div>

              {/* Documents Upload */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents officiels (Actes de vente, Titres fonciers)
                </h2>
                
                <div className="space-y-4">
                  {uploadedFiles.documents.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-accent" />
                            <span className="text-sm truncate max-w-[200px]">{doc.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(idx)}
                            className="p-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={handleDocSelect}
                      className="hidden"
                      id="doc-upload"
                      data-testid="doc-upload-input"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => document.getElementById('doc-upload').click()}
                      disabled={uploadingDoc}
                    >
                      {uploadingDoc ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Ajouter un document
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: PDF, JPG, PNG. Max 10MB par fichier.
                  </p>
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
                  {drawingMode 
                    ? 'Cliquez sur la carte pour ajouter des points de délimitation' 
                    : 'Cliquez sur la carte pour définir l\'emplacement exact du terrain'
                  }
                </p>
                
                {/* Boundary Drawing Controls */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    type="button"
                    variant={drawingMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(!drawingMode)}
                    data-testid="toggle-drawing-btn"
                  >
                    {drawingMode ? 'Mode: Délimitation' : 'Mode: Position'}
                  </Button>
                  
                  {drawingMode && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={finishBoundary}
                        disabled={boundaryPoints.length < 3}
                        data-testid="finish-boundary-btn"
                      >
                        Terminer ({boundaryPoints.length} points)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearBoundary}
                        data-testid="clear-boundary-btn"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Effacer
                      </Button>
                    </>
                  )}
                </div>

                {boundaryPoints.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Délimitation: {boundaryPoints.length} points définis
                  </div>
                )}
              </div>
              
              <div className="h-[500px] border border-border">
                <LandMap
                  lands={[]}
                  clickMode={true}
                  onMapClick={handleMapClick}
                  markerPosition={markerPosition}
                  boundaryPoints={boundaryPoints}
                  drawingMode={drawingMode}
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
