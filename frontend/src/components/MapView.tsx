import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Location } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  locations: Location[];
  center?: [number, number];
  selectedId?: number;
}

export default function MapView({ locations, center, selectedId }: Props) {
  const mapCenter: [number, number] = center || 
    locations.length > 0 
      ? [locations[0].latitude, locations[0].longitude]
      : [10.762622, 106.660172]; // HCM default

  return (
    <div className="h-full rounded-xl overflow-hidden shadow-lg">
      <MapContainer center={mapCenter} zoom={10} style={{ height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            eventHandlers={{
              click: () => window.location.href = `/detail/${loc.id}`
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">{loc.name}</p>
                <p className="text-sm text-gray-600">{loc.city}</p>
                <p className="text-xs">Đánh giá: {loc.rating_avg.toFixed(1)} ★</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}