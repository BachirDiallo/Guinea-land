import { useState, useEffect } from 'react';
import { Star, User } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Star Rating Display Component
export const StarRating = ({ rating, size = 'sm', showNumber = true }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star 
          key={i} 
          className={`${sizeClasses[size]} text-yellow-500`} 
          weight="fill" 
        />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <Star 
          key={i} 
          className={`${sizeClasses[size]} text-yellow-500`} 
          weight="duotone" 
        />
      );
    } else {
      stars.push(
        <Star 
          key={i} 
          className={`${sizeClasses[size]} text-gray-300`} 
          weight="regular" 
        />
      );
    }
  }
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showNumber && rating > 0 && (
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

// Interactive Star Rating Input
export const StarRatingInput = ({ value, onChange, size = 'lg' }) => {
  const [hoverValue, setHoverValue] = useState(0);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="transition-transform hover:scale-110 active:scale-95"
          data-testid={`star-${star}`}
        >
          <Star 
            className={`${sizeClasses[size]} ${
              star <= (hoverValue || value) 
                ? 'text-yellow-500' 
                : 'text-gray-300'
            }`}
            weight={star <= (hoverValue || value) ? 'fill' : 'regular'}
          />
        </button>
      ))}
    </div>
  );
};

// User Rating Badge (compact display)
export const UserRatingBadge = ({ rating, count, size = 'sm' }) => {
  if (!rating || rating === 0) {
    return (
      <span className="text-xs text-muted-foreground">Pas encore évalué</span>
    );
  }
  
  return (
    <div className="flex items-center gap-1.5">
      <Star className="w-4 h-4 text-yellow-500" weight="fill" />
      <span className="font-medium text-sm">{rating.toFixed(1)}</span>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
};

// Reviews List Component
export const ReviewsList = ({ userId, limit = 5 }) => {
  const [reviews, setReviews] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API}/reviews/user/${userId}?limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setUserInfo({
            name: data.user_name,
            rating_average: data.rating_average,
            rating_count: data.rating_count
          });
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReviews();
    }
  }, [userId, limit]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {userInfo && (
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <StarRating rating={userInfo.rating_average || 0} size="md" />
          </div>
          <span className="text-sm text-muted-foreground">
            {userInfo.rating_count || 0} évaluation(s)
          </span>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune évaluation pour le moment
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.review_id} 
              className="p-4 bg-secondary/30 border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{review.reviewer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" showNumber={false} />
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Verification Badge Component
export const VerificationBadge = ({ level, verifierRole, verifierName }) => {
  const levelColors = {
    quartier: 'bg-blue-100 text-blue-800 border-blue-200',
    secteur: 'bg-green-100 text-green-800 border-green-200',
    commune: 'bg-purple-100 text-purple-800 border-purple-200',
    prefecture: 'bg-orange-100 text-orange-800 border-orange-200',
    region: 'bg-red-100 text-red-800 border-red-200',
    platform: 'bg-primary text-primary-foreground border-primary'
  };

  const levelLabels = {
    quartier: 'Chef de Quartier',
    secteur: 'Chef de Secteur',
    village: 'Chef de Village',
    commune: 'Maire',
    prefecture: 'Préfet',
    region: 'Gouverneur',
    platform: 'Admin Plateforme'
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded ${
        levelColors[level] || 'bg-gray-100 text-gray-800 border-gray-200'
      }`}
      title={`Vérifié par ${verifierName || levelLabels[level]}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {levelLabels[level] || level}
    </div>
  );
};

// Price Comparison Component
export const PriceComparison = ({ landId }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const res = await fetch(`${API}/prices/compare/${landId}`);
        if (res.ok) {
          const data = await res.json();
          setComparison(data);
        }
      } catch (error) {
        console.error('Error fetching price comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    if (landId) {
      fetchComparison();
    }
  }, [landId]);

  if (loading) {
    return <div className="animate-pulse h-16 bg-gray-200 rounded"></div>;
  }

  if (!comparison || !comparison.reference_available) {
    return null;
  }

  const statusColors = {
    fair_market: 'text-green-600 bg-green-50',
    above_market: 'text-orange-600 bg-orange-50',
    below_market: 'text-blue-600 bg-blue-50'
  };

  const statusLabels = {
    fair_market: 'Prix du marché',
    above_market: 'Au-dessus du marché',
    below_market: 'En-dessous du marché'
  };

  const assessment = comparison.price_assessment;

  return (
    <div className="bg-card border border-border p-4">
      <h4 className="font-bold text-sm mb-3">Comparaison de prix</h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Prix/m² de ce terrain</div>
          <div className="font-bold text-lg">{comparison.land_price_per_m2?.toLocaleString()} GNF</div>
        </div>
        <div>
          <div className="text-muted-foreground">Prix/m² du quartier</div>
          <div className="font-bold text-lg">{comparison.reference?.price_per_m2_avg?.toLocaleString()} GNF</div>
        </div>
      </div>

      {assessment && (
        <div className={`mt-3 p-2 rounded text-center text-sm font-medium ${statusColors[assessment.status]}`}>
          {statusLabels[assessment.status]}
          {assessment.difference_percent !== 0 && (
            <span className="ml-1">
              ({assessment.difference_percent > 0 ? '+' : ''}{assessment.difference_percent}%)
            </span>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-muted-foreground text-center">
        Fourchette du quartier: {comparison.reference?.price_per_m2_min?.toLocaleString()} - {comparison.reference?.price_per_m2_max?.toLocaleString()} GNF/m²
      </div>
    </div>
  );
};

export default { StarRating, StarRatingInput, UserRatingBadge, ReviewsList, VerificationBadge, PriceComparison };
