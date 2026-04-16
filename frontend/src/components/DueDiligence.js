import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warning,
  CheckCircle,
  XCircle,
  Info,
  MapPin,
  Buildings,
  Drop,
  Shovel,
  Scales,
  FileText,
  CaretRight,
  Shield,
  Lighthouse,
  Tree,
  House,
  FirstAid,
  GraduationCap,
  Lightning,
  ArrowRight,
  Eye
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

// Risk Level Badge
const RiskBadge = ({ level, size = 'md' }) => {
  const config = {
    low: { bg: 'bg-green-100', text: 'text-green-700', label: 'Faible' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Modéré' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Élevé' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critique' }
  };

  const c = config[level] || config.medium;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 ${c.bg} ${c.text} rounded-full ${sizeClass} font-medium`}>
      {level === 'low' && <CheckCircle size={14} weight="fill" />}
      {level === 'medium' && <Info size={14} weight="fill" />}
      {level === 'high' && <Warning size={14} weight="fill" />}
      {level === 'critical' && <XCircle size={14} weight="fill" />}
      {c.label}
    </span>
  );
};

// Alert Type Icon
const AlertTypeIcon = ({ type, className = '' }) => {
  const icons = {
    infrastructure: Buildings,
    flood: Drop,
    mining: Shovel,
    dispute: Scales,
    erosion: Tree
  };
  const Icon = icons[type] || Info;
  return <Icon className={className} weight="fill" />;
};

// Project Type Icon
const ProjectTypeIcon = ({ type }) => {
  const icons = {
    road: Lighthouse,
    hospital: FirstAid,
    school: GraduationCap,
    dam: Lightning,
    building: Buildings
  };
  const Icon = icons[type] || Buildings;
  return <Icon size={16} className="text-muted-foreground" />;
};

// Main Risk Assessment Component
export const RiskAssessmentCard = ({ landId }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/risk-assessment`);
        if (res.ok) {
          setRiskData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching risk assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchRiskAssessment();
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

  if (!riskData) return null;

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="risk-assessment-card">
      {/* Header */}
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Évaluation des Risques</span>
        </div>
        <RiskBadge level={riskData.overall_risk} size="sm" />
      </div>

      <div className="p-4">
        {/* Risk Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`text-4xl font-black ${getRiskColor(riskData.risk_score)}`}>
            {riskData.risk_score}
          </div>
          <div className="flex-1">
            <div className="text-sm mb-1 flex items-center justify-between">
              <span>Score de sécurité</span>
              <span className={`font-medium ${getRiskColor(riskData.risk_score)}`}>
                {riskData.risk_label}
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(riskData.risk_score)} transition-all duration-500`}
                style={{ width: `${riskData.risk_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className={`text-center p-2 rounded ${riskData.infrastructure_nearby > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
            <Buildings className={`w-5 h-5 mx-auto mb-1 ${riskData.infrastructure_nearby > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            <div className="text-xs font-medium">{riskData.infrastructure_nearby}</div>
            <div className="text-[10px] text-muted-foreground">Projets</div>
          </div>
          <div className={`text-center p-2 rounded ${riskData.flood_zone ? 'bg-blue-50' : 'bg-green-50'}`}>
            <Drop className={`w-5 h-5 mx-auto mb-1 ${riskData.flood_zone ? 'text-blue-600' : 'text-green-600'}`} />
            <div className="text-xs font-medium">{riskData.flood_zone ? 'Oui' : 'Non'}</div>
            <div className="text-[10px] text-muted-foreground">Inondable</div>
          </div>
          <div className={`text-center p-2 rounded ${riskData.mining_zone ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <Shovel className={`w-5 h-5 mx-auto mb-1 ${riskData.mining_zone ? 'text-yellow-600' : 'text-green-600'}`} />
            <div className="text-xs font-medium">{riskData.mining_zone ? 'Oui' : 'Non'}</div>
            <div className="text-[10px] text-muted-foreground">Zone Minière</div>
          </div>
          <div className={`text-center p-2 rounded ${riskData.active_disputes > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <Scales className={`w-5 h-5 mx-auto mb-1 ${riskData.active_disputes > 0 ? 'text-red-600' : 'text-green-600'}`} />
            <div className="text-xs font-medium">{riskData.active_disputes}</div>
            <div className="text-[10px] text-muted-foreground">Litiges</div>
          </div>
        </div>

        {/* Alerts Summary */}
        {riskData.alerts?.length > 0 && (
          <div className="space-y-2 mb-4">
            {riskData.alerts.slice(0, 2).map((alert, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-2 p-2 rounded text-sm ${
                  alert.severity === 'high' || alert.severity === 'critical' 
                    ? 'bg-red-50 text-red-800' 
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 text-yellow-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                <AlertTypeIcon type={alert.type} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-xs opacity-80">{alert.message}</div>
                </div>
              </div>
            ))}
            {riskData.alerts.length > 2 && (
              <div className="text-xs text-muted-foreground text-center">
                +{riskData.alerts.length - 2} autre(s) alerte(s)
              </div>
            )}
          </div>
        )}

        {/* No Alerts */}
        {(!riskData.alerts || riskData.alerts.length === 0) && (
          <div className="text-center py-3 text-green-600 bg-green-50 rounded mb-4">
            <CheckCircle className="w-6 h-6 mx-auto mb-1" weight="fill" />
            <div className="text-sm font-medium">Aucun risque majeur détecté</div>
          </div>
        )}

        {/* View Details Button */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Rapport Complet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" weight="fill" />
                Rapport d'Évaluation des Risques
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <div className={`text-5xl font-black ${getRiskColor(riskData.risk_score)}`}>
                  {riskData.risk_score}/100
                </div>
                <RiskBadge level={riskData.overall_risk} />
              </div>

              {/* All Alerts */}
              {riskData.alerts?.length > 0 && (
                <Accordion type="multiple" className="space-y-2">
                  {riskData.alerts.map((alert, idx) => (
                    <AccordionItem key={idx} value={`alert-${idx}`} className="border rounded-lg overflow-hidden">
                      <AccordionTrigger className={`px-3 py-2 hover:no-underline ${
                        alert.severity === 'high' || alert.severity === 'critical'
                          ? 'bg-red-50'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-50'
                          : 'bg-blue-50'
                      }`}>
                        <div className="flex items-center gap-2 text-left">
                          <AlertTypeIcon type={alert.type} className="w-5 h-5" />
                          <div>
                            <div className="font-medium text-sm">{alert.title}</div>
                            <div className="text-xs text-muted-foreground">{alert.message}</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 py-2 bg-white">
                        {alert.details?.map((detail, didx) => (
                          <div key={didx} className="flex items-center gap-2 py-1 border-b last:border-0 text-sm">
                            {alert.type === 'infrastructure' && (
                              <>
                                <ProjectTypeIcon type={detail.type} />
                                <div className="flex-1">
                                  <div className="font-medium">{detail.project}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {detail.status === 'planned' ? 'Planifié' : 
                                     detail.status === 'approved' ? 'Approuvé' :
                                     detail.status === 'study' ? 'En étude' : detail.status}
                                    {detail.start_year && ` • Début ${detail.start_year}`}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {detail.distance_m}m
                                </div>
                              </>
                            )}
                            {alert.type === 'flood' && (
                              <>
                                <Drop className="w-4 h-4 text-blue-500" />
                                <div className="flex-1">
                                  <div className="font-medium">{detail.zone}</div>
                                </div>
                                <RiskBadge level={detail.risk_level} size="sm" />
                              </>
                            )}
                            {alert.type === 'mining' && (
                              <>
                                <Shovel className="w-4 h-4 text-yellow-600" />
                                <div className="flex-1">
                                  <div className="font-medium">{detail.zone}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {detail.company} • {detail.type}
                                  </div>
                                </div>
                                <div className="text-xs">{detail.distance_km}km</div>
                              </>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* Environmental Notes */}
              {riskData.environmental_notes?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <Tree className="w-4 h-4" />
                    Notes Environnementales
                  </div>
                  {riskData.environmental_notes.map((note, idx) => (
                    <div key={idx} className="text-sm text-green-700">• {note.note}</div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                ⚠️ {riskData.disclaimer}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Cadastre Check Component
export const CadastreCheckCard = ({ landId }) => {
  const [cadastreData, setCadastreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCadastreCheck = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/cadastre-check`);
        if (res.ok) {
          setCadastreData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching cadastre check:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchCadastreCheck();
    }
  }, [landId]);

  if (loading) return null;
  if (!cadastreData) return null;

  const statusConfig = {
    registered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Enregistré' },
    unregistered: { icon: Warning, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Non enregistré' }
  };

  const titleConfig = {
    valid: { icon: CheckCircle, color: 'text-green-600', label: 'Titre valide' },
    pending: { icon: Info, color: 'text-yellow-600', label: 'En cours' },
    none: { icon: XCircle, color: 'text-red-600', label: 'Aucun titre' }
  };

  const regStatus = statusConfig[cadastreData.registration_status] || statusConfig.unregistered;
  const titleStatus = titleConfig[cadastreData.title_status] || titleConfig.none;
  const RegIcon = regStatus.icon;
  const TitleIcon = titleStatus.icon;

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="cadastre-check-card">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Vérification Cadastrale</span>
        </div>
      </div>

      <div className="p-4">
        {/* Registration Status */}
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded mb-3">
          <div className="flex items-center gap-2">
            <RegIcon className={`w-5 h-5 ${regStatus.color}`} weight="fill" />
            <div>
              <div className="text-sm font-medium">{regStatus.label}</div>
              {cadastreData.cadastre_reference && (
                <div className="text-xs text-muted-foreground font-mono">
                  Réf: {cadastreData.cadastre_reference}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title Status */}
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded mb-3">
          <div className="flex items-center gap-2">
            <TitleIcon className={`w-5 h-5 ${titleStatus.color}`} weight="fill" />
            <span className="text-sm font-medium">{titleStatus.label}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded ${
            cadastreData.verification_level === 'full' ? 'bg-green-100 text-green-700' :
            cadastreData.verification_level === 'partial' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {cadastreData.verification_level === 'full' ? 'Vérification complète' :
             cadastreData.verification_level === 'partial' ? 'Vérification partielle' :
             'Non vérifié'}
          </span>
        </div>

        {/* Official Area */}
        {cadastreData.official_area_m2 && (
          <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-border">
            <span className="text-muted-foreground">Surface officielle</span>
            <span className="font-medium">{cadastreData.official_area_m2.toLocaleString()} m²</span>
          </div>
        )}

        {/* Recommendations */}
        {cadastreData.recommendations?.filter(Boolean).length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-1">Recommandations:</div>
            {cadastreData.recommendations.filter(Boolean).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border">
          {cadastreData.disclaimer}
        </div>
      </div>
    </div>
  );
};

// Land Disputes Component
export const LandDisputesCard = ({ landId }) => {
  const [disputeData, setDisputeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/disputes`);
        if (res.ok) {
          setDisputeData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchDisputes();
    }
  }, [landId]);

  if (loading) return null;
  if (!disputeData || (!disputeData.has_disputes && disputeData.total === 0)) return null;

  const disputeTypeLabels = {
    boundary: 'Limite de propriété',
    ownership: 'Propriété contestée',
    inheritance: 'Succession',
    fraud: 'Fraude',
    encroachment: 'Empiètement'
  };

  const statusLabels = {
    open: 'Ouvert',
    pending: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé'
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden" data-testid="land-disputes-card">
      <div className="bg-red-100 px-4 py-3 border-b border-red-200 flex items-center gap-2">
        <Scales className="w-5 h-5 text-red-600" weight="fill" />
        <span className="font-semibold text-red-800">
          Litiges Fonciers ({disputeData.total})
        </span>
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 text-center p-2 bg-white rounded">
            <div className="text-xl font-bold text-red-600">{disputeData.open_count}</div>
            <div className="text-xs text-red-800">Ouvert(s)</div>
          </div>
          <div className="flex-1 text-center p-2 bg-white rounded">
            <div className="text-xl font-bold text-green-600">{disputeData.resolved_count}</div>
            <div className="text-xs text-green-800">Résolu(s)</div>
          </div>
        </div>

        {/* Dispute List */}
        {disputeData.disputes?.map((dispute, idx) => (
          <div key={idx} className="bg-white rounded p-3 mb-2 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">
                {disputeTypeLabels[dispute.dispute_type] || dispute.dispute_type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                dispute.status === 'open' ? 'bg-red-100 text-red-700' :
                dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {statusLabels[dispute.status] || dispute.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{dispute.description}</p>
            <div className="text-[10px] text-gray-400 mt-1">
              Signalé le {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default { RiskAssessmentCard, CadastreCheckCard, LandDisputesCard };
