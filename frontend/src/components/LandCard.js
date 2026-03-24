import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Ruler, Tag, CheckCircle } from '@phosphor-icons/react';

export const LandCard = ({ land, compact = false }) => {
  const { t } = useTranslation();

  const statusColors = {
    available: 'bg-primary text-primary-foreground',
    pending: 'bg-yellow-500 text-black',
    sold: 'bg-accent text-accent-foreground'
  };

  const statusLabels = {
    available: t('lands.status.available'),
    pending: t('lands.status.pending'),
    sold: t('lands.status.sold')
  };

  const typeLabels = {
    residential: t('lands.type.residential'),
    commercial: t('lands.type.commercial'),
    agricultural: t('lands.type.agricultural')
  };

  const defaultImage = 'https://images.unsplash.com/photo-1613183919710-2ff7b3bec845?w=800&q=80';

  // Compact mode for mobile map view
  if (compact) {
    return (
      <Link 
        to={`/lands/${land.land_id}`}
        className="block bg-card border border-border card-hover-lift overflow-hidden"
        data-testid={`land-card-${land.land_id}`}
      >
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative w-24 sm:w-32 h-24 sm:h-28 flex-shrink-0 overflow-hidden">
            <img
              src={land.photos?.[0] || defaultImage}
              alt={land.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1">
              <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 ${statusColors[land.status]}`}>
                {statusLabels[land.status]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-2 sm:p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm sm:text-base line-clamp-1">{land.title}</h3>
              {land.verified && (
                <CheckCircle size={14} weight="fill" className="text-green-600 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm mt-0.5">
              <MapPin size={12} weight="fill" />
              <span className="line-clamp-1">{land.commune}</span>
            </div>

            <div className="flex items-center justify-between mt-2 sm:mt-3">
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <Ruler size={14} className="text-muted-foreground" />
                <span>{land.size?.toLocaleString()} m²</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-accent text-xs sm:text-sm">
                  {land.price?.toLocaleString()} GNF
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/lands/${land.land_id}`}
      className="block bg-card border border-border card-hover-lift overflow-hidden"
      data-testid={`land-card-${land.land_id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={land.photos?.[0] || defaultImage}
          alt={land.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-xs font-bold px-2 py-1 ${statusColors[land.status]}`}>
            {statusLabels[land.status]}
          </span>
          {land.verified && (
            <span className="text-xs font-bold px-2 py-1 bg-green-600 text-white flex items-center gap-1">
              <CheckCircle size={12} weight="fill" />
              {t('land.detail.verified')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{land.title}</h3>
        
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin size={14} weight="fill" />
          <span className="line-clamp-1">{land.commune}, {land.region}</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {land.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <Ruler size={16} className="text-muted-foreground" />
            <span>{land.size?.toLocaleString()} {t('common.m2')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag size={16} className="text-accent" weight="fill" />
            <span className="font-bold text-accent">
              {land.price?.toLocaleString()} {t('common.gnf')}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground">
            {typeLabels[land.land_type]}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default LandCard;
