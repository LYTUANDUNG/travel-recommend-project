import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import type { Location } from '../types';
import type { OSMNode } from '../api/external';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// ... (keep icons code same)

interface Props {
  locations: Location[];
  pois?: OSMNode[];
  center?: [number, number];
  zoom?: number;
  selectedId?: number;
  onMapMove?: (center: { lat: number, lng: number }, bounds: any) => void;
  route?: any; // GeoJSON route object
}

function MapEvents({ onMapMove }: { onMapMove?: (center: { lat: number, lng: number }, bounds: any) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onMapMove) {
        onMapMove(map.getCenter(), map.getBounds());
      }
    },
  });
  return null;
}

function MapController({ center, zoom }: { center?: [number, number], zoom?: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ locations, pois = [], center, zoom = 10, selectedId, onMapMove, route }: Props) {
  const mapCenter: [number, number] = center ||
    (locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [10.762622, 106.660172]); // HCM default

  // Convert GeoJSON route coordinate [lng, lat] to Leaflet [lat, lng]
  const routePositions = route ? route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]) : [];

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg z-0 relative">
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        <MapEvents onMapMove={onMapMove} />
        <MapController center={center} zoom={zoom} />

        {/* Render Route if available */}
        {route && routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            color="blue"
            weight={5}
            opacity={0.7}
          />
        )}

        {/* Internal Locations (Ours) */}
        {locations.map((loc) => (
          <Marker
            key={loc.location_id}
            position={[loc.latitude, loc.longitude]}
            eventHandlers={{
              click: () => window.location.href = `/detail/${loc.location_id}`
            }}
          >
            <Popup>
              <div className="text-center min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{loc.name}</h3>
                <img src={loc.thumbnail_url} alt={loc.name} className="w-full h-24 object-cover rounded-md mb-2" />
                <p className="text-sm text-gray-600 mb-1">{loc.province}</p>
                <div className="flex justify-center items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-bold">{loc.average_rating.toFixed(1)}</span>
                </div>
                <a href={`/detail/${loc.location_id}`} className="block mt-2 px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700">Xem chi tiết</a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ... (keep POIs code same) */}
      </MapContainer>
    </div>
  );
}