import { useEffect, useState, useRef, useCallback } from 'react';
import { Map, Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from '@phosphor-icons/react';

// Mapbox public demo token - works for development/demo purposes
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2p0MG01MXRqMW45cjQzb2R6b2ptc3J4MSJ9.gUWqjLwOuV8gOmRSbVxlrg';

// Guinea center coordinates
const GUINEA_CENTER = {
  longitude: -10.9408,
  latitude: 9.9456,
  zoom: 7
};

export const LandMap = ({ 
  lands = [], 
  selectedLand = null, 
  onLandSelect = () => {}, 
  onMapClick = null,
  clickMode = false,
  markerPosition = null,
  height = '100%'
}) => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState(GUINEA_CENTER);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#133E26';
      case 'pending': return '#D4A84B';
      case 'sold': return '#D95A2B';
      default: return '#133E26';
    }
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        cursor={clickMode ? 'crosshair' : 'grab'}
      >
        <NavigationControl position="top-right" />

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

        {/* Land markers */}
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
              className="cursor-pointer transition-transform hover:scale-110"
              style={{ color: getStatusColor(land.status) }}
            >
              <MapPin size={32} weight="fill" />
            </div>
          </Marker>
        ))}

        {/* Click mode marker */}
        {clickMode && markerPosition && (
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

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={[0, -30]}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">{popupInfo.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">{popupInfo.address}</p>
              <div className="flex justify-between text-xs">
                <span>{popupInfo.size?.toLocaleString()} m²</span>
                <span className="font-bold">{popupInfo.price?.toLocaleString()} GNF</span>
              </div>
              <div className="mt-2">
                <span 
                  className={`text-xs px-2 py-1 ${
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
