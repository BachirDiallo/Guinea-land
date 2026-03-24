import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
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
import { ArrowLeft, Receipt, House, User } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NewTransaction() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [lands, setLands] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    land_id: searchParams.get('land_id') || '',
    buyer_id: '',
    price: '',
    notes: '',
    documents: []
  });

  useEffect(() => {
    fetchLands();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (formData.land_id) {
      const land = lands.find(l => l.land_id === formData.land_id);
      setSelectedLand(land);
      if (land) {
        setFormData(prev => ({ ...prev, price: land.price.toString() }));
      }
    }
  }, [formData.land_id, lands]);

  const fetchLands = async () => {
    try {
      const res = await fetch(`${API}/lands?status=available`);
      const data = await res.json();
      setLands(data);
    } catch (error) {
      console.error('Error fetching lands:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/users`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.land_id || !formData.buyer_id || !formData.price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erreur lors de la création');
      }

      toast.success('Transaction enregistrée avec succès!');
      navigate('/transactions');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="new-transaction-page">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Receipt className="w-8 h-8 text-accent" />
            {t('transactions.new')}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Land Selection */}
          <div className="bg-card border border-border p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <House className="w-5 h-5" />
              Sélection du terrain
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="land_id" className="form-label">{t('transactions.land')} *</Label>
                <Select value={formData.land_id} onValueChange={(v) => handleChange('land_id', v)}>
                  <SelectTrigger data-testid="transaction-land-select">
                    <SelectValue placeholder="Sélectionnez un terrain" />
                  </SelectTrigger>
                  <SelectContent>
                    {lands.map(land => (
                      <SelectItem key={land.land_id} value={land.land_id}>
                        {land.title} - {land.commune}, {land.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLand && (
                <div className="p-4 bg-secondary">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{selectedLand.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedLand.address}</p>
                      <p className="text-sm mt-1">Surface: {selectedLand.size?.toLocaleString()} m²</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Prix affiché</div>
                      <div className="font-bold text-accent">{selectedLand.price?.toLocaleString()} GNF</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buyer Selection */}
          <div className="bg-card border border-border p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Acheteur
            </h2>
            
            <div>
              <Label htmlFor="buyer_id" className="form-label">{t('transactions.buyer')} *</Label>
              <Select value={formData.buyer_id} onValueChange={(v) => handleChange('buyer_id', v)}>
                <SelectTrigger data-testid="transaction-buyer-select">
                  <SelectValue placeholder="Sélectionnez l'acheteur" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.user_id !== selectedLand?.owner_id).map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-card border border-border p-6">
            <h2 className="font-bold mb-4">Détails de la transaction</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="form-label">{t('transactions.price')} (GNF) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  required
                  data-testid="transaction-price-input"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="form-label">{t('transactions.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Notes supplémentaires sur la transaction..."
                  data-testid="transaction-notes-input"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedLand && formData.buyer_id && formData.price && (
            <div className="bg-accent/10 border-2 border-accent p-6">
              <h2 className="font-bold mb-4">Résumé de la transaction</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Terrain:</span>
                  <span className="font-medium">{selectedLand.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendeur:</span>
                  <span className="font-medium">{selectedLand.owner_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acheteur:</span>
                  <span className="font-medium">
                    {users.find(u => u.user_id === formData.buyer_id)?.name}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-accent/30">
                  <span className="font-bold">Prix de vente:</span>
                  <span className="font-black text-lg text-accent">
                    {parseFloat(formData.price).toLocaleString()} GNF
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full h-12 shadow-brutal-md btn-hover-lift"
            disabled={loading}
            data-testid="submit-transaction-btn"
          >
            {loading ? t('common.loading') : 'Enregistrer la transaction'}
          </Button>
        </form>
      </div>
    </div>
  );
}
