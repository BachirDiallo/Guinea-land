import { useEffect, useState, useRef, useCallback } from 'react';
import { Map, Marker, Popup, Source, Layer, NavigationControl, GeolocateControl, ScaleControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Circle, WifiSlash } from '@phosphor-icons/react';

// Mapbox public demo token - works for development/demo purposes
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2p0MG01MXRqMW45cjQzb2R6b2ptc3J4MSJ9.gUWqjLwOuV8gOmRSbVxlrg';

// Guinea center coordinates
const GUINEA_CENTER = {
  longitude: -10.9408,
  latitude: 9.9456,
  zoom: 7
};

// Check if device is mobile/touch
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const LandMap = ({ 
  lands = [], 
  selectedLand = null, 
  onLandSelect = () => {}, 
  onMapClick = null,
  clickMode = false,
  markerPosition = null,
  boundaryPoints = [],
  drawingMode = false,
  height = '100%'
}) => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState(GUINEA_CENTER);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isMobile] = useState(isTouchDevice());

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fly to selected land
  useEffect(() => {
    if (selectedLand && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLand.longitude, selectedLand.latitude],
        zoom: 14,
        duration: 1500
      });
    }
  }, [selectedLand]);

  // Handle map click for adding new land
  const handleMapClick = useCallback((event) => {
    if (clickMode && onMapClick) {
      onMapClick({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat
      });
    }
  }, [clickMode, onMapClick]);

  // Generate GeoJSON for land boundaries
  const boundariesGeoJson = {
    type: 'FeatureCollection',
    features: lands
      .filter(land => land.boundaries && land.boundaries.length > 0)
      .map(land => ({
        type: 'Feature',
        properties: {
          land_id: land.land_id,
          title: land.title,
          status: land.status
        },
        geometry: {
          type: 'Polygon',
          coordinates: [land.boundaries]
        }
      }))
  };

  // Generate GeoJSON for drawing boundary
  const drawingBoundaryGeoJson = boundaryPoints.length > 0 ? {
    type: 'FeatureCollection',
    features: [
      // Line connecting points
      ...(boundaryPoints.length > 1 ? [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: boundaryPoints
        }
      }] : []),
      // Polygon if 3+ points (preview)
      ...(boundaryPoints.length >= 3 ? [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[...boundaryPoints, boundaryPoints[0]]]
        }
      }] : [])
    ]
  } : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#133E26';
      case 'pending': return '#D4A84B';
      case 'sold': return '#D95A2B';
      default: return '#133E26';
    }
  };

  return (
    <div style={{ height, width: '100%' }} className="relative">
      {/* Offline indicator for map */}
      {isOffline && (
        <div 
          className="absolute top-2 left-2 right-2 z-10 bg-yellow-500 text-black text-xs px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          data-testid="map-offline-indicator"
        >
          <WifiSlash className="w-4 h-4" weight="fill" />
          <span>Mode hors ligne - Tuiles mises en cache uniquement</span>
        </div>
      )}
      
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        cursor={clickMode ? 'crosshair' : 'grab'}
        // Mobile-optimized settings
        touchZoomRotate={true}
        touchPitch={false}
        dragRotate={!isMobile}
        pitchWithRotate={false}
        // Performance optimizations
        maxTileCacheSize={isMobile ? 50 : 200}
        trackResize={true}
        // Touch interaction settings
        cooperativeGestures={false}
      >
        {/* Navigation controls - positioned for mobile thumb reach */}
        <NavigationControl 
          position={isMobile ? "bottom-right" : "top-right"} 
          showCompass={!isMobile}
          visualizePitch={false}
        />
        
        {/* Geolocation control for mobile - helps users find their location */}
        <GeolocateControl
          position={isMobile ? "bottom-right" : "top-right"}
          trackUserLocation={true}
          showUserHeading={true}
          showAccuracyCircle={false}
          positionOptions={{ enableHighAccuracy: true }}
        />
        
        {/* Scale control for reference */}
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Land boundaries layer */}
        {boundariesGeoJson.features.length > 0 && (
          <Source id="boundaries" type="geojson" data={boundariesGeoJson}>
            <Layer
              id="boundaries-fill"
              type="fill"
              paint={{
                'fill-color': ['match', ['get', 'status'],
                  'available', '#133E26',
                  'pending', '#D4A84B',
                  'sold', '#D95A2B',
                  '#133E26'
                ],
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="boundaries-line"
              type="line"
              paint={{
                'line-color': ['match', ['get', 'status'],
                  'available', '#133E26',
                  'pending', '#D4A84B',
                  'sold', '#D95A2B',
                  '#133E26'
                ],
                'line-width': 2
              }}
            />
          </Source>
        )}

        {/* Drawing boundary layer */}
        {drawingBoundaryGeoJson && (
          <Source id="drawing-boundary" type="geojson" data={drawingBoundaryGeoJson}>
            {/* Polygon fill (preview) */}
            <Layer
              id="drawing-fill"
              type="fill"
              filter={['==', '$type', 'Polygon']}
              paint={{
                'fill-color': '#D95A2B',
                'fill-opacity': 0.2
              }}
            />
            {/* Line */}
            <Layer
              id="drawing-line"
              type="line"
              paint={{
                'line-color': '#D95A2B',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Boundary points markers */}
        {boundaryPoints.map((point, idx) => (
          <Marker
            key={`boundary-point-${idx}`}
            longitude={point[0]}
            latitude={point[1]}
            anchor="center"
          >
            <div className="w-4 h-4 bg-accent border-2 border-white rounded-full shadow-md flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">{idx + 1}</span>
            </div>
          </Marker>
        ))}

        {/* Land markers - larger touch targets on mobile */}
        {lands.map(land => (
          <Marker
            key={land.land_id}
            longitude={land.longitude}
            latitude={land.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(land);
              onLandSelect(land);
            }}
          >
            <div 
              className={`cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isMobile ? 'p-2' : ''}`}
              style={{ color: getStatusColor(land.status) }}
              data-testid={`land-marker-${land.land_id}`}
            >
              <MapPin size={isMobile ? 40 : 32} weight="fill" />
            </div>
          </Marker>
        ))}

        {/* Click mode marker */}
        {clickMode && markerPosition && !drawingMode && (
          <Marker
            longitude={markerPosition.longitude}
            latitude={markerPosition.latitude}
            anchor="bottom"
          >
            <div className="text-accent animate-bounce">
              <MapPin size={40} weight="fill" />
            </div>
          </Marker>
        )}

        {/* Popup - mobile optimized */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={[0, isMobile ? -40 : -30]}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            maxWidth={isMobile ? "280px" : "300px"}
            className="land-popup"
          >
            <div className={`${isMobile ? 'p-3' : 'p-2'} min-w-[200px]`}>
              <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-sm'} mb-1`}>{popupInfo.title}</h3>
              <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground mb-2`}>{popupInfo.address}</p>
              <div className={`flex justify-between ${isMobile ? 'text-sm' : 'text-xs'}`}>
                <span>{popupInfo.size?.toLocaleString()} m²</span>
                <span className="font-bold">{popupInfo.price?.toLocaleString()} GNF</span>
              </div>
              <div className="mt-2">
                <span 
                  className={`${isMobile ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'} ${
                    popupInfo.status === 'available' ? 'bg-primary text-primary-foreground' :
                    popupInfo.status === 'pending' ? 'bg-yellow-500 text-black' :
                    'bg-accent text-accent-foreground'
                  }`}
                >
                  {popupInfo.status === 'available' ? 'Disponible' :
                   popupInfo.status === 'pending' ? 'En cours' : 'Vendu'}
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default LandMap;
