import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { Location as TravelLocation } from '../types/schema';
import { OSMNode } from '../api/external';

interface Props {
  locations: TravelLocation[];
  pois?: OSMNode[];
  center?: [number, number];
  zoom?: number;
  selectedId?: number;
  onMapMove?: (center: [number, number], zoom: number) => void;
  route?: any;
  showOrder?: boolean;
}

// Custom Icon helper
const createNumberedIcon = (number: number, color: string = '#ec4899') => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const isValidCoords = (lat: any, lng: any): boolean => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

export default function MapView({ 
    locations = [], 
    pois = [], 
    center, 
    zoom = 15, 
    onMapMove, 
    route, 
    showOrder = false 
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
        const initialCenter = center && isValidCoords(center[0], center[1]) 
            ? [Number(center[0]), Number(center[1])] 
            : locations.length > 0 && isValidCoords(locations[0].latitude, locations[0].longitude)
                ? [Number(locations[0].latitude), Number(locations[0].longitude)]
                : [16.0667769, 108.2137381];

        const map = L.map(mapContainerRef.current, {
            center: initialCenter as L.LatLngExpression,
            zoom: zoom,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        map.on('moveend', () => {
            if (onMapMove) {
                const c = map.getCenter();
                onMapMove([c.lat, c.lng], map.getZoom());
            }
        });

        markersRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Auto-invalidate size to fix grey map
        setTimeout(() => map.invalidateSize(), 300);

    } catch (err) {
        console.error("Leaflet Vanilla Init Error:", err);
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Update Center/Zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    if (isValidCoords(center[0], center[1])) {
        mapInstanceRef.current.flyTo([Number(center[0]), Number(center[1])], zoom);
    }
  }, [center, zoom]);

  // Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersRef.current;
    if (!map || !markersGroup) return;

    // Clear previous
    markersGroup.clearLayers();
    if (routeRef.current) {
        routeRef.current.remove();
        routeRef.current = null;
    }

    // Add Location Markers
    const validLocs = locations.filter(l => isValidCoords(l.latitude, l.longitude));
    validLocs.forEach((loc, idx) => {
        const marker = L.marker([Number(loc.latitude), Number(loc.longitude)], {
            icon: showOrder ? createNumberedIcon(idx + 1) : L.divIcon({ className: 'default-marker', html: '<div style="background:#ec4899;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>'})
        });
        marker.bindPopup(`<div class="p-2"><b>${loc.name}</b><p class="text-xs mt-1">${loc.address || ''}</p></div>`);
        markersGroup.addLayer(marker);
    });

    // Add Route
    if (route?.geometry?.coordinates) {
        const positions = route.geometry.coordinates
            .filter((c: any) => Array.isArray(c) && c.length >= 2)
            .map((c: any) => [Number(c[1]), Number(c[0])]);
        
        if (positions.length > 0) {
            routeRef.current = L.polyline(positions, { color: '#ec4899', weight: 6, opacity: 0.8 }).addTo(map);
        }
    }

    // Add POIs
    pois.forEach((poi, idx) => {
        if (isValidCoords(poi.lat, poi.lon)) {
            const marker = L.marker([Number(poi.lat), Number(poi.lon)], {
                icon: createNumberedIcon(idx + 1, '#10b981')
            });
            marker.bindPopup(`<div class="p-1 text-xs">${poi.tags?.name || 'POI'}</div>`);
            markersGroup.addLayer(marker);
        }
    });

    // Fit bounds if no explicit center provided but locations exists
    if (!center && validLocs.length > 0) {
        const bounds = L.latLngBounds(validLocs.map(l => [Number(l.latitude), Number(l.longitude)]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

  }, [locations, pois, route]);

  return (
    <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-[2rem] overflow-hidden bg-slate-100 airy-shadow isolation-isolate"
        style={{ zIndex: 0 }}
    />
  );
}