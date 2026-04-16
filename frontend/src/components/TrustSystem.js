import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldWarning,
  Warning,
  CheckCircle,
  XCircle,
  Users,
  Files,
  MapPin,
  Clock,
  CaretRight,
  Info,
  Eye,
  Plus,
  UserCircle,
  Certificate,
  Handshake,
  House,
  ArrowRight
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Trust Level Badge Component
export const TrustBadge = ({ level, size = 'md' }) => {
  const config = {
    excellent: { 
      icon: ShieldCheck, 
      bg: 'bg-green-100', 
      text: 'text-green-700', 
      border: 'border-green-300',
      label: 'Très fiable' 
    },
    good: { 
      icon: ShieldCheck, 
      bg: 'bg-blue-100', 
      text: 'text-blue-700', 
      border: 'border-blue-300',
      label: 'Fiable' 
    },
    moderate: { 
      icon: Shield, 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-700', 
      border: 'border-yellow-300',
      label: 'Modéré' 
    },
    low: { 
      icon: ShieldWarning, 
      bg: 'bg-orange-100', 
      text: 'text-orange-700', 
      border: 'border-orange-300',
      label: 'Faible' 
    },
    very_low: { 
      icon: ShieldWarning, 
      bg: 'bg-red-100', 
      text: 'text-red-700', 
      border: 'border-red-300',
      label: 'Très faible' 
    },
    non_verified: { 
      icon: Shield, 
      bg: 'bg-gray-100', 
      text: 'text-gray-500', 
      border: 'border-gray-300',
      label: 'Non vérifié' 
    }
  };

  const { icon: Icon, bg, text, border, label } = config[level] || config.non_verified;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 ${bg} ${text} ${border} border rounded-full ${sizeClasses} font-medium`}>
      <Icon size={size === 'sm' ? 12 : 16} weight="fill" />
      {label}
    </span>
  );
};

// Trust Score Card Component
export const TrustScoreCard = ({ landId }) => {
  const [trustData, setTrustData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchTrustScore = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/trust-score`);
        if (res.ok) {
          setTrustData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching trust score:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchTrustScore();
    }
  }, [landId]);

  if (loading) {
    return (
      <div className="bg-card border border-border p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!trustData) return null;

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="trust-score-card">
      {/* Header */}
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Score de Confiance</span>
        </div>
        <TrustBadge level={trustData.trust_level} size="sm" />
      </div>

      <div className="p-4">
        {/* Main Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`text-4xl font-black ${getScoreColor(trustData.percentage)}`}>
            {trustData.percentage}%
          </div>
          <div className="flex-1">
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(trustData.percentage)} transition-all duration-500`}
                style={{ width: `${trustData.percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {trustData.total_score} / {trustData.max_score} points
            </div>
          </div>
        </div>

        {/* Warnings */}
        {trustData.warnings?.length > 0 && (
          <div className="mb-4 space-y-2">
            {trustData.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                <Warning className="w-4 h-4 mt-0.5 flex-shrink-0" weight="fill" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Score Components Preview */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(trustData.components || {}).slice(0, 4).map(([key, comp]) => (
            <div key={key} className="bg-secondary/20 p-2 rounded text-center">
              <div className="text-lg font-bold">{comp.score}/{comp.max}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {key === 'official_verification' && 'Officiel'}
                {key === 'community_verification' && 'Communauté'}
                {key === 'ownership_history' && 'Historique'}
                {key === 'documentation' && 'Documents'}
                {key === 'no_duplicates' && 'Unicité'}
              </div>
            </div>
          ))}
        </div>

        {/* Details Button */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Voir les détails
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" weight="fill" />
                Analyse de Confiance Détaillée
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <div className={`text-5xl font-black ${getScoreColor(trustData.percentage)}`}>
                  {trustData.percentage}%
                </div>
                <TrustBadge level={trustData.trust_level} />
              </div>

              {/* Components Breakdown */}
              <div className="space-y-3">
                {Object.entries(trustData.components || {}).map(([key, comp]) => (
                  <div key={key} className="border border-border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {key === 'official_verification' && '🏛️ Vérification Officielle'}
                        {key === 'community_verification' && '👥 Vérification Communautaire'}
                        {key === 'ownership_history' && '📜 Historique de Propriété'}
                        {key === 'documentation' && '📁 Documentation'}
                        {key === 'no_duplicates' && '🔍 Unicité du Terrain'}
                      </span>
                      <span className="font-bold">{comp.score}/{comp.max}</span>
                    </div>
                    <Progress value={(comp.score / comp.max) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">{comp.details}</div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {trustData.recommendations?.filter(Boolean).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Recommandations
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {trustData.recommendations.filter(Boolean).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Duplicate Alert Component
export const DuplicateAlertCard = ({ landId }) => {
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/duplicate-alerts`);
        if (res.ok) {
          setAlertData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching duplicate alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchAlerts();
    }
  }, [landId]);

  if (loading) return null;
  if (!alertData || alertData.risk_level === 'low') return null;

  const riskConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: XCircle },
    high: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', icon: Warning },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', icon: Info }
  };

  const config = riskConfig[alertData.risk_level] || riskConfig.medium;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`} data-testid="duplicate-alert">
      <div className={`flex items-start gap-3 ${config.text}`}>
        <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" weight="fill" />
        <div className="flex-1">
          <div className="font-bold mb-1">
            {alertData.risk_level === 'critical' && '🚨 Alerte Critique: Doublon Possible'}
            {alertData.risk_level === 'high' && '⚠️ Attention: Conflit Territorial Possible'}
            {alertData.risk_level === 'medium' && 'ℹ️ Information: Terrains Similaires Détectés'}
          </div>
          
          {alertData.warnings?.map((warning, idx) => (
            <div key={idx} className="text-sm mb-1">{warning}</div>
          ))}

          {alertData.similar_lands?.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-sm font-medium">Terrains similaires:</div>
              {alertData.similar_lands.slice(0, 3).map((land, idx) => (
                <div 
                  key={idx}
                  className="bg-white/50 rounded p-2 text-sm cursor-pointer hover:bg-white/80 transition-colors"
                  onClick={() => navigate(`/lands/${land.land_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{land.title}</span>
                    <span className="text-xs">{land.distance_meters}m</span>
                  </div>
                  <div className="text-xs opacity-75">
                    {land.size?.toLocaleString()} m² • {land.price?.toLocaleString()} GNF • {land.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Community Verification Component
export const CommunityVerifications = ({ landId, isOwner = false }) => {
  const [verifications, setVerifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/community-verifications`);
        if (res.ok) {
          setVerifications(await res.json());
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchVerifications();
    }
  }, [landId]);

  if (loading) return null;

  const trustLevelConfig = {
    highly_trusted: { icon: ShieldCheck, color: 'text-green-600', label: 'Hautement vérifié' },
    verified: { icon: CheckCircle, color: 'text-blue-600', label: 'Vérifié' },
    pending: { icon: Clock, color: 'text-yellow-600', label: 'En attente' },
    disputed: { icon: Warning, color: 'text-red-600', label: 'Contesté' },
    non_verified: { icon: Shield, color: 'text-gray-400', label: 'Non vérifié' }
  };

  const config = trustLevelConfig[verifications?.trust_level] || trustLevelConfig.non_verified;
  const Icon = config.icon;

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="community-verifications">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Vérifications Communautaires</span>
        </div>
        <span className={`flex items-center gap-1 text-sm ${config.color}`}>
          <Icon size={16} weight="fill" />
          {config.label}
        </span>
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{verifications?.verified_count || 0}</div>
            <div className="text-xs text-green-700">Vérifiés</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{verifications?.pending_count || 0}</div>
            <div className="text-xs text-yellow-700">En attente</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{verifications?.flagged_count || 0}</div>
            <div className="text-xs text-red-700">Signalés</div>
          </div>
        </div>

        {/* Trust Score */}
        {verifications?.trust_score !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Score de confiance communautaire</span>
              <span className="font-bold">{verifications.trust_score}%</span>
            </div>
            <Progress value={verifications.trust_score} className="h-2" />
          </div>
        )}

        {/* Verifications List */}
        {verifications?.verifications?.length > 0 ? (
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="verifications">
              <AccordionTrigger className="text-sm">
                Voir les {verifications.total_verifications} vérification(s)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {verifications.verifications.map((v, idx) => (
                    <div key={idx} className="border border-border rounded p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{v.verifier_name || 'Vérificateur'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          v.status === 'verified' ? 'bg-green-100 text-green-700' :
                          v.status === 'flagged' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {v.status === 'verified' ? 'Vérifié' : v.status === 'flagged' ? 'Signalé' : 'En attente'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {v.verifier_type} • {v.relationship || 'Relation non spécifiée'}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm mb-4">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucune vérification communautaire</p>
          </div>
        )}

        {/* Request Verification Button */}
        {isOwner && (
          <Button className="w-full" size="sm" onClick={() => setShowRequestForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Demander une vérification
          </Button>
        )}
      </div>
    </div>
  );
};

// Ownership History Component
export const OwnershipHistory = ({ landId, isOwner = false }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/ownership-history`);
        if (res.ok) {
          setHistory(await res.json());
        }
      } catch (error) {
        console.error('Error fetching ownership history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchHistory();
    }
  }, [landId]);

  if (loading) return null;

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="ownership-history">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Historique de Propriété</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {history?.chain_length || 0} transfert(s)
        </span>
      </div>

      <div className="p-4">
        {/* Current Owner */}
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-white" weight="fill" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Propriétaire actuel</div>
            <div className="font-bold flex items-center gap-2">
              {history?.current_owner?.name || 'Inconnu'}
              {history?.current_owner?.verified && (
                <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
              )}
            </div>
          </div>
        </div>

        {/* Chain Timeline */}
        {history?.ownership_chain?.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-4">
              {history.ownership_chain.map((entry, idx) => (
                <div key={idx} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                    entry.type === 'platform' ? 'bg-primary' : 
                    entry.verified ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  
                  <div className="bg-secondary/20 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        entry.type === 'platform' ? 'bg-primary/10 text-primary' :
                        entry.verified ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.type === 'platform' ? 'Via Plateforme' : 
                         entry.verified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{entry.from}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium">{entry.to}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">
                        {entry.transfer_type === 'sale' ? '💰 Vente' :
                         entry.transfer_type === 'inheritance' ? '👨‍👩‍👧 Héritage' :
                         entry.transfer_type === 'donation' ? '🎁 Donation' :
                         entry.transfer_type === 'court_order' ? '⚖️ Décision judiciaire' :
                         entry.transfer_type}
                      </span>
                      {entry.price && (
                        <span>• {entry.price.toLocaleString()} GNF</span>
                      )}
                      {entry.documents_count > 0 && (
                        <span>• {entry.documents_count} doc(s)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun historique disponible</p>
            <p className="text-xs mt-1">L'historique aide à établir la légitimité du terrain</p>
          </div>
        )}

        {/* Add History Button */}
        {isOwner && (
          <Button variant="outline" className="w-full mt-4" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un transfert historique
          </Button>
        )}
      </div>
    </div>
  );
};

export default { TrustBadge, TrustScoreCard, DuplicateAlertCard, CommunityVerifications, OwnershipHistory };
