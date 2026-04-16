import { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendUp,
  TrendDown,
  Minus,
  Buildings,
  GraduationCap,
  FirstAid,
  Lightning,
  Drop,
  ShoppingCart,
  ChartLineUp,
  ChartBar,
  Coins,
  Tag,
  CheckCircle,
  Warning,
  Info,
  CaretRight,
  Eye,
  ArrowRight,
  Star,
  Medal,
  Target
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Grade Badge Component
const GradeBadge = ({ grade, label }) => {
  const colors = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-10 h-10 ${colors[grade]} rounded-lg flex items-center justify-center text-white font-black text-xl`}>
        {grade}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

// Infrastructure Score Card
export const InfrastructureScoreCard = ({ landId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/infrastructure-score`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching infrastructure score:', error);
      } finally {
        setLoading(false);
      }
    };
    if (landId) fetchData();
  }, [landId]);

  if (loading || !data) return null;

  const scoreIcons = {
    healthcare: FirstAid,
    education: GraduationCap,
    commerce: ShoppingCart,
    electricity: Lightning,
    water: Drop
  };

  const getScoreColor = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 75) return 'text-green-600';
    if (pct >= 50) return 'text-blue-600';
    if (pct >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="infrastructure-score-card">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Buildings className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Score Infrastructure</span>
        </div>
        <GradeBadge grade={data.grade} label={data.grade_label} />
      </div>

      <div className="p-4">
        {/* Main Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`text-4xl font-black ${getScoreColor(data.total_score, data.max_score)}`}>
            {data.percentage}%
          </div>
          <div className="flex-1">
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  data.percentage >= 70 ? 'bg-green-500' :
                  data.percentage >= 50 ? 'bg-blue-500' :
                  data.percentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${data.percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.total_score} / {data.max_score} points
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(data.scores).map(([key, score]) => {
            const Icon = scoreIcons[key] || Buildings;
            return (
              <div 
                key={key}
                className="text-center p-2 bg-secondary/20 rounded"
                title={score.label}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${getScoreColor(score.score, score.max)}`} weight="fill" />
                <div className="text-sm font-bold">{score.score}</div>
                <div className="text-[10px] text-muted-foreground">{score.label}</div>
              </div>
            );
          })}
        </div>

        {/* Nearby Infrastructure */}
        {data.nearby_infrastructure?.length > 0 && (
          <div className="space-y-1 mb-4">
            <div className="text-xs font-medium text-muted-foreground">Infrastructures proches:</div>
            {data.nearby_infrastructure.slice(0, 3).map((infra, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm bg-secondary/10 rounded px-2 py-1">
                <span>{infra.name}</span>
                <span className="text-xs text-muted-foreground">{infra.distance_km} km</span>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Détails complets
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Analyse Infrastructure Détaillée</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Object.entries(data.scores).map(([key, score]) => {
                const Icon = scoreIcons[key] || Buildings;
                return (
                  <div key={key} className="border border-border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" weight="fill" />
                        <span className="font-medium">{score.label}</span>
                      </div>
                      <span className="font-bold">{score.score}/{score.max}</span>
                    </div>
                    <Progress value={(score.score / score.max) * 100} className="h-2" />
                    {score.nearest && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Plus proche: {score.nearest.name} ({score.nearest.distance_km} km)
                      </div>
                    )}
                    {score.coverage_percent !== undefined && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Couverture régionale: {score.coverage_percent}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Fair Price Estimator Card
export const FairPriceEstimatorCard = ({ landId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/price-estimate`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching price estimate:', error);
      } finally {
        setLoading(false);
      }
    };
    if (landId) fetchData();
  }, [landId]);

  if (loading || !data) return null;

  const assessmentConfig = {
    good_deal: { icon: TrendDown, color: 'text-green-600', bg: 'bg-green-50' },
    underpriced: { icon: TrendDown, color: 'text-green-600', bg: 'bg-green-50' },
    fair: { icon: Minus, color: 'text-blue-600', bg: 'bg-blue-50' },
    slightly_high: { icon: TrendUp, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    overpriced: { icon: TrendUp, color: 'text-red-600', bg: 'bg-red-50' },
    no_price: { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' }
  };

  const config = assessmentConfig[data.price_assessment] || assessmentConfig.fair;
  const AssessmentIcon = config.icon;

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="price-estimator-card">
      <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" weight="fill" />
          <span className="font-semibold">Estimation Prix Juste</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
          {data.estimation?.confidence === 'high' ? 'Haute confiance' : 
           data.estimation?.confidence === 'medium' ? 'Confiance moyenne' : 'Estimation'}
        </span>
      </div>

      <div className="p-4">
        {/* Price Assessment */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg} mb-4`}>
          <AssessmentIcon className={`w-8 h-8 ${config.color}`} weight="fill" />
          <div>
            <div className={`font-bold ${config.color}`}>{data.price_assessment_label}</div>
            <div className="text-xs text-muted-foreground">{data.price_assessment_detail}</div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-secondary/20 rounded">
            <div className="text-xs text-muted-foreground mb-1">Prix demandé</div>
            <div className="text-lg font-bold text-foreground">
              {data.listed_price?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">GNF</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Estimation</div>
            <div className="text-lg font-bold text-primary">
              {data.estimation?.total_estimated?.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">GNF</div>
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-2">Fourchette de prix estimée:</div>
          <div className="relative h-8 bg-secondary/30 rounded-full overflow-hidden">
            {/* Range bar */}
            <div 
              className="absolute h-full bg-primary/30"
              style={{ 
                left: '15%', 
                width: '70%' 
              }}
            />
            {/* Estimated point */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white"
              style={{ left: '50%', transform: 'translateX(-50%) translateY(-50%)' }}
            />
            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px]">
              <span>{(data.estimation?.range_low / 1000000).toFixed(0)}M</span>
              <span className="font-bold">{(data.estimation?.total_estimated / 1000000).toFixed(0)}M</span>
              <span>{(data.estimation?.range_high / 1000000).toFixed(0)}M</span>
            </div>
          </div>
        </div>

        {/* Price Per M² */}
        <div className="flex items-center justify-between text-sm p-2 bg-secondary/10 rounded mb-4">
          <span className="text-muted-foreground">Prix estimé par m²</span>
          <span className="font-bold">{data.estimation?.price_per_m2?.toLocaleString()} GNF</span>
        </div>

        {/* Adjustments Preview */}
        {data.adjustments?.length > 0 && (
          <div className="space-y-1 mb-4">
            <div className="text-xs font-medium text-muted-foreground">Facteurs d'ajustement:</div>
            {data.adjustments.slice(0, 3).map((adj, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span>{adj.factor}</span>
                <span className={adj.value > 0 ? 'text-green-600' : 'text-red-600'}>
                  {adj.impact}
                </span>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <ChartBar className="w-4 h-4 mr-2" />
              Analyse détaillée
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Méthodologie d'Estimation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Reference Prices */}
              <div className="border border-border rounded p-3">
                <div className="font-medium mb-2">Prix de référence - {data.region}</div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Min</div>
                    <div className="font-bold">{data.reference_prices?.region_min?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Moyen</div>
                    <div className="font-bold text-primary">{data.reference_prices?.region_avg?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Max</div>
                    <div className="font-bold">{data.reference_prices?.region_max?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Prix par m² en GNF</div>
              </div>

              {/* All Adjustments */}
              <div className="border border-border rounded p-3">
                <div className="font-medium mb-2">Tous les ajustements</div>
                <div className="space-y-2">
                  {data.adjustments?.map((adj, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span>{adj.factor}</span>
                      <span className={`font-medium ${adj.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {adj.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology */}
              <div className="text-xs text-muted-foreground bg-secondary/20 rounded p-2">
                {data.methodology}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Investment Analysis Card
export const InvestmentAnalysisCard = ({ landId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/lands/${landId}/investment-analysis`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching investment analysis:', error);
      } finally {
        setLoading(false);
      }
    };
    if (landId) fetchData();
  }, [landId]);

  if (loading || !data) return null;

  const recommendationConfig = {
    highly_recommended: { icon: Star, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    recommended: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    moderate: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    caution: { icon: Warning, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  };

  const config = recommendationConfig[data.recommendation] || recommendationConfig.moderate;
  const RecommendationIcon = config.icon;

  return (
    <div className="bg-card border border-border overflow-hidden" data-testid="investment-analysis-card">
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <ChartLineUp className="w-5 h-5" weight="fill" />
          <span className="font-semibold">Analyse d'Investissement</span>
        </div>
      </div>

      <div className="p-4">
        {/* Recommendation */}
        <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border} mb-4`}>
          <RecommendationIcon className={`w-8 h-8 ${config.color} flex-shrink-0`} weight="fill" />
          <div>
            <div className={`font-bold ${config.color}`}>{data.recommendation_label}</div>
            <div className="text-sm text-muted-foreground">{data.recommendation_detail}</div>
          </div>
        </div>

        {/* Investment Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-secondary"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${data.investment_score * 2.51} 251`}
                strokeLinecap="round"
                className="text-primary transform -rotate-90 origin-center"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black">{data.investment_score}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">Score d'investissement</div>
            <div className="space-y-1">
              {data.investment_factors?.slice(0, 2).map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{factor.factor}</span>
                  <span>{factor.points}/{factor.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Value Projections */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Projections de valeur</div>
          <div className="flex gap-2">
            {data.value_projections?.map((proj, idx) => (
              <div key={idx} className="flex-1 text-center p-2 bg-secondary/20 rounded">
                <div className="text-xs text-muted-foreground">{proj.years} an{proj.years > 1 ? 's' : ''}</div>
                <div className="text-sm font-bold text-green-600">+{proj.gain_percent}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Outlook */}
        <div className="flex items-center justify-between text-sm p-2 bg-secondary/10 rounded mb-4">
          <span className="text-muted-foreground">Croissance {data.regional_outlook?.region}</span>
          <span className="font-bold text-green-600">+{data.regional_outlook?.growth_rate_percent}%/an</span>
        </div>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Target className="w-4 h-4 mr-2" />
              Rapport complet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analyse d'Investissement Complète</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* All Factors */}
              <div className="border border-border rounded p-3">
                <div className="font-medium mb-2">Facteurs d'évaluation</div>
                {data.investment_factors?.map((factor, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{factor.factor}</span>
                      <span className="font-bold">{factor.points}/{factor.max}</span>
                    </div>
                    <Progress value={(factor.points / factor.max) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">{factor.detail}</div>
                  </div>
                ))}
              </div>

              {/* Opportunities */}
              {data.opportunities?.filter(Boolean).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <TrendUp className="w-4 h-4" />
                    Opportunités
                  </div>
                  {data.opportunities.filter(Boolean).map((opp, idx) => (
                    <div key={idx} className="text-sm text-green-700 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                      {opp}
                    </div>
                  ))}
                </div>
              )}

              {/* Risks */}
              {data.risks?.filter(Boolean).length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <div className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <Warning className="w-4 h-4" />
                    Risques à considérer
                  </div>
                  {data.risks.filter(Boolean).map((risk, idx) => (
                    <div key={idx} className="text-sm text-orange-700 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                      {risk}
                    </div>
                  ))}
                </div>
              )}

              {/* Full Projections */}
              <div className="border border-border rounded p-3">
                <div className="font-medium mb-2">Projections détaillées</div>
                <div className="space-y-2">
                  {data.value_projections?.map((proj, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span>{proj.years} an{proj.years > 1 ? 's' : ''}</span>
                      <div className="text-right">
                        <div className="font-bold">{(proj.projected_value / 1000000).toFixed(0)}M GNF</div>
                        <div className="text-xs text-green-600">+{proj.gain_percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Combined Better Decisions Section
export const BetterDecisionsSection = ({ landId }) => {
  return (
    <div className="space-y-4" data-testid="better-decisions-section">
      <div className="flex items-center gap-2 px-1">
        <Lightbulb className="w-5 h-5 text-yellow-500" weight="fill" />
        <h3 className="font-bold text-lg">Aide à la Décision</h3>
      </div>
      
      <InfrastructureScoreCard landId={landId} />
      <FairPriceEstimatorCard landId={landId} />
      <InvestmentAnalysisCard landId={landId} />
    </div>
  );
};

export default { InfrastructureScoreCard, FairPriceEstimatorCard, InvestmentAnalysisCard, BetterDecisionsSection };
