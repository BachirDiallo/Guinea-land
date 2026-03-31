import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Lightbulb, 
  Bug, 
  ChatCircle, 
  PaperPlaneTilt,
  CheckCircle
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Feedback() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'suggestion',
    category: 'general',
    title: '',
    description: '',
    user_email: ''
  });

  const feedbackTypes = [
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'bug', label: 'Signaler un bug', icon: Bug, color: 'text-red-500' },
    { value: 'complaint', label: 'Réclamation', icon: ChatCircle, color: 'text-orange-500' },
    { value: 'other', label: 'Autre', icon: ChatCircle, color: 'text-gray-500' }
  ];

  const categories = [
    { value: 'general', label: 'Général' },
    { value: 'ui', label: 'Interface utilisateur' },
    { value: 'map', label: 'Carte / Localisation' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'verification', label: 'Vérification' },
    { value: 'payments', label: 'Paiements' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Erreur lors de l\'envoi');

      setSubmitted(true);
      toast.success('Merci pour votre feedback!');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du feedback');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Merci!</h2>
          <p className="text-muted-foreground mb-6">
            Votre feedback a été envoyé avec succès. Notre équipe l'examinera attentivement.
          </p>
          <Button onClick={() => setSubmitted(false)}>
            Envoyer un autre feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="feedback-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Suggestions & Feedback
          </h1>
          <p className="text-primary-foreground/80">
            Aidez-nous à améliorer Guinea Land Hub
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="bg-card border border-border p-6">
            <Label className="text-lg font-bold mb-4 block">Type de feedback</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    className={`p-4 border-2 transition-all text-center ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    data-testid={`feedback-type-${type.value}`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${type.color}`} weight="fill" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Details */}
          <div className="bg-card border border-border p-6 space-y-4">
            <div>
              <Label className="form-label">Catégorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger data-testid="feedback-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="form-label">Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Résumez votre feedback en une phrase"
                required
                data-testid="feedback-title"
              />
            </div>

            <div>
              <Label className="form-label">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre suggestion, problème ou réclamation en détail..."
                rows={6}
                required
                data-testid="feedback-description"
              />
            </div>

            {!user && (
              <div>
                <Label className="form-label">Votre email (optionnel)</Label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                  placeholder="Pour recevoir une réponse"
                  data-testid="feedback-email"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full h-12 gap-2"
            disabled={loading}
            data-testid="submit-feedback-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PaperPlaneTilt className="w-5 h-5" />
                Envoyer le feedback
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
