import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Location as TravelLocation } from '../types/schema';
import { OSMNode } from '../api/external';
import { cn } from '../utils/cn';

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
const createNumberedIcon = (number: number, color: string = '#f97316') => {
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

  // Measurement state & refs
  const [isMeasuring, setIsMeasuring] = useState(false);
  const isMeasuringRef = useRef(false);
  const measurePointsRef = useRef<L.LatLng[]>([]);
  const measureLineRef = useRef<L.Polyline | null>(null);
  const measureMarkersRef = useRef<L.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
        const initialCenter = center && isValidCoords(center[0], center[1]) 
            ? [Number(center[0]), Number(center[1])] 
            : locations.length > 0 && isValidCoords(locations[0].latitude, locations[0].longitude)
                ? [Number(locations[0].latitude), Number(locations[0].longitude)]
                : [10.8230989, 106.6296638]; // Default coordinates (Ho Chi Minh City)

        const map = L.map(mapContainerRef.current, {
            center: initialCenter as L.LatLngExpression,
            zoom: zoom,
            zoomControl: true,
            attributionControl: false
        });

        // Define base layers
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        });
        const satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Satellite'
        });
        const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB'
        });

        // Add default layer
        osm.addTo(map);

        // Add Layer Switcher Control
        const baseMaps = {
            "Bản đồ nền (OSM)": osm,
            "Ảnh vệ tinh (Google)": satellite,
            "Giao diện sáng (Carto)": cartoLight
        };
        L.control.layers(baseMaps, {}, { position: 'topright' }).addTo(map);

        // Add Scale Control
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

        map.on('moveend', () => {
            if (onMapMove) {
                const c = map.getCenter();
                onMapMove([c.lat, c.lng], map.getZoom());
            }
        });

        // Click handler for distance measurement
        map.on('click', (e: L.LeafletMouseEvent) => {
            if (!isMeasuringRef.current) return;
            const latlng = e.latlng;
            measurePointsRef.current.push(latlng);
            
            // Add a pin for each measure stop
            const marker = L.marker(latlng, {
                icon: L.divIcon({
                    html: `<div style="background:#ef4444;width:8px;height:8px;border-radius:50%;border:1px solid white"></div>`,
                    className: 'measure-dot',
                    iconSize: [8, 8],
                    iconAnchor: [4, 4]
                })
            }).addTo(map);
            measureMarkersRef.current.push(marker);

            // Redraw dashed path line
            if (measurePointsRef.current.length > 1) {
                if (measureLineRef.current) {
                    measureLineRef.current.setLatLngs(measurePointsRef.current);
                } else {
                    measureLineRef.current = L.polyline(measurePointsRef.current, { color: '#ef4444', weight: 3, dashArray: '5, 10' }).addTo(map);
                }
                
                // Accumulate distance
                let totalDist = 0;
                for (let i = 0; i < measurePointsRef.current.length - 1; i++) {
                    totalDist += measurePointsRef.current[i].distanceTo(measurePointsRef.current[i+1]);
                }
                
                const distKm = (totalDist / 1000).toFixed(2);
                marker.bindTooltip(`Tổng: ${distKm} km`, { permanent: true, direction: 'top', className: 'bg-red-500 text-white font-bold text-xs p-1.5 rounded-lg border-none shadow' }).openTooltip();
            } else {
                marker.bindTooltip('Điểm xuất phát', { permanent: true, direction: 'top', className: 'bg-slate-700 text-white font-bold text-xs p-1 rounded border-none' }).openTooltip();
            }
        });

        markersRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Auto-invalidate size to fix grey map issues
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
            icon: showOrder ? createNumberedIcon(idx + 1) : L.divIcon({ className: 'default-marker', html: '<div style="background:#f97316;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>'})
        });
        
        const ratingHtml = loc.average_rating 
            ? `<div style="display:flex;align-items:center;gap:3px;margin-top:4px;font-size:10px;font-weight:bold;color:#f59e0b">⭐ <span>${loc.average_rating}</span> <span style="color:#94a3b8;font-weight:normal">(${loc.total_reviews || 0})</span></div>` 
            : '';
        const imgHtml = loc.thumbnail_url 
            ? `<div style="width:100%;height:80px;border-radius:8px;overflow:hidden;margin-bottom:6px;background:#f1f5f9"><img src="${loc.thumbnail_url}" style="width:100%;height:100%;object-fit:cover;display:block"/></div>` 
            : '';
        
        const popupContent = `
            <div style="font-family:sans-serif;width:160px;padding:2px;line-height:1.4">
                ${imgHtml}
                <div style="font-weight:bold;color:#1e293b;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${loc.name}</div>
                <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:bold;margin-top:2px">${loc.category_name || 'Khám phá'}</div>
                ${ratingHtml}
                <p style="font-size:9px;color:#64748b;margin-top:4px;padding-top:4px;border-top:1px solid #f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${loc.address || ''}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
    });

    // Add Route
    if (route?.geometry?.coordinates) {
        const positions = route.geometry.coordinates
            .filter((c: any) => Array.isArray(c) && c.length >= 2)
            .map((c: any) => [Number(c[1]), Number(c[0])]);
        
        if (positions.length > 0) {
            routeRef.current = L.polyline(positions, { color: '#f97316', weight: 6, opacity: 0.8 }).addTo(map);
        }
    }

    // Add POIs
    pois.forEach((poi, idx) => {
        if (isValidCoords(poi.lat, poi.lon)) {
            const marker = L.marker([Number(poi.lat), Number(poi.lon)], {
                icon: createNumberedIcon(idx + 1, '#10b981')
            });
            marker.bindPopup(`<div class="p-1 text-xs font-sans">${poi.tags?.name || 'POI'}</div>`);
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

  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            map.flyTo([latitude, longitude], 16);
            
            // Add blue circle highlight
            L.circle([latitude, longitude], {
                radius: 25,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.35
            }).addTo(map).bindPopup("<div class='p-1 font-sans font-bold text-xs'>Vị trí của bạn</div>").openPopup();
        },
        (err) => {
            alert("Không thể định vị vị trí của bạn: " + err.message);
        }
    );
  };

  const clearMeasurement = () => {
    measurePointsRef.current = [];
    if (measureLineRef.current) {
        measureLineRef.current.remove();
        measureLineRef.current = null;
    }
    measureMarkersRef.current.forEach(m => m.remove());
    measureMarkersRef.current = [];
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 airy-shadow border border-slate-200/50 dark:border-slate-800">
      <div 
          ref={mapContainerRef} 
          className="w-full h-full relative z-0"
      />
      
      {/* Floating Interactive Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 font-sans">
         {/* Locate button */}
         <button 
             onClick={handleLocateMe}
             className="px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-300 transition-all font-semibold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
             title="Tìm vị trí GPS hiện tại"
         >
             <span className="text-sm">📍</span> Định vị của tôi
         </button>

         {/* Distance Measure button */}
         <button 
             onClick={() => {
                 const next = !isMeasuring;
                 setIsMeasuring(next);
                 isMeasuringRef.current = next;
                 if (!next) {
                     clearMeasurement();
                 }
             }}
             className={cn(
                 "px-4 py-2 rounded-xl shadow-sm border font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95",
                 isMeasuring 
                   ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600" 
                   : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-300"
             )}
             title="Bật/Tắt thước đo khoảng cách"
         >
             <span className="text-sm">📏</span> {isMeasuring ? "Đang đo (Click bản đồ)" : "Đo khoảng cách"}
         </button>

         {isMeasuring && (
             <button 
                 onClick={clearMeasurement}
                 className="py-1 bg-slate-100/90 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase rounded-lg shadow-sm text-center transition cursor-pointer border border-slate-200/30"
             >
                 Xóa kết quả đo
             </button>
         )}
      </div>
    </div>
  );
}