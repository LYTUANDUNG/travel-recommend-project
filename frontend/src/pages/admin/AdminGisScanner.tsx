import { useState, useEffect } from 'react';
import { api } from '../../api';
import { MapPin, Search, Loader2, Save, Map as MapIcon, CheckCircle2, Radius, Info, Navigation, Globe, ListFilter, Database, ChevronLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position ? (
        <Marker position={position}>
            <Popup>
                <div className="font-bold text-orange-600 text-xs uppercase tracking-widest">Tọa độ quét</div>
                <div className="font-mono font-bold mt-1 text-slate-800"> {position[0].toFixed(6)}, {position[1].toFixed(6)}</div>
            </Popup>
        </Marker>
    ) : null;
}

export default function AdminGisScanner() {
    const [center, setCenter] = useState<[number, number]>([16.0544, 108.2022]); // Da Nang default
    const [radius, setRadius] = useState(1000); // 1km default
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<number | null>(null);
    const [successList, setSuccessList] = useState<string[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        setCategoriesLoading(true);
        api.category.getAll().then(res => {
            if (res.success) setCategories(res.data);
        }).finally(() => setCategoriesLoading(false));
    }, []);

    const handleScan = async () => {
        setLoading(true);
        setResults([]);
        setSuccessList([]);
        try {
            const res = await api.client.get('/admin/gis/scan', {
                params: { lat: center[0], lng: center[1], radius }
            });
            if (res.data.success) {
                const scannedData = res.data.data || [];
                // Automate: Reverse geocode for missing addresses
                const enhanced = await Promise.all(scannedData.slice(0, 50).map(async (loc: any) => {
                    if (!loc.address || loc.address === 'Chưa xác định') {
                        try {
                            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}`, {
                                headers: {
                                    'User-Agent': 'TravelApp_Admin/1.0'
                                }
                            });
                            const data = await rev.json();
                            return { ...loc, address: data.display_name || loc.address };
                        } catch (e) { return loc; }
                    }
                    return loc;
                }));
                setResults(enhanced);
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi kết nối OpenStreetMap API");
        }
        setLoading(false);
    };

    const handleImport = async (loc: any, index: number) => {
        setImporting(index);
        try {
            const locCat = (loc.categoryName || "").toLowerCase();
            const locDesc = (loc.description || "").toLowerCase();
            
            // Enhanced Tourism Matching
            const matchedCat = categories.find((c: any) => {
                const name = c.name.toLowerCase();
                return name === locCat ||
                    (locCat === "restaurant" && name.includes("nhà hàng")) ||
                    (locCat === "cafe" && name.includes("cà phê")) ||
                    (locCat === "hotel" && name.includes("khách sạn")) ||
                    (locCat === "attraction" && name.includes("điểm tham quan")) ||
                    (locCat === "museum" && name.includes("bảo tàng")) ||
                    (locCat === "tourism" && name.includes("du lịch")) ||
                    (locDesc.includes("chùa") && name.includes("tâm linh")) ||
                    (locDesc.includes("park") && name.includes("công viên"))
            });

            const payload = {
                name: loc.name,
                description: loc.description || `Địa điểm du lịch quét từ hệ thống GIS.`,
                address: loc.address,
                latitude: loc.latitude,
                longitude: loc.longitude,
                province: loc.province || "Đà Nẵng",
                category_id: matchedCat ? matchedCat.category_id : (categories.length > 0 ? categories[0].category_id : 1),
                price_level: 2,
                price_range_str: loc.priceRangeStr || "Tham khảo",
                opening_hour: loc.openingHour || "08:00",
                closing_hour: loc.closing_hour || "21:00",
                thumbnail_url: loc.thumbnailUrl || "https://images.unsplash.com/photo-1555436169-20d9321f98c6",
                images: [],
                tags: []
            };

            const res = await api.client.post('/locations', payload);
            if (res.data.success) {
                setSuccessList(prev => [...prev, loc.name]);
            } else {
                alert("Lỗi: " + res.data.message);
            }
        } catch (error: any) {
            console.error("GIS Import failed", error);
            alert("Lỗi khi thêm địa điểm: " + (error.response?.data?.message || error.message));
        }
        setImporting(null);
    };

    const handleImportAll = async () => {
        if (results.length === 0) return;
        if (!confirm(`Import ${results.length} địa điểm vào cơ sở dữ liệu?`)) return;

        for (let i = 0; i < results.length; i++) {
            const loc = results[i];
            if (successList.includes(loc.name)) continue;
            await handleImport(loc, i);
            await new Promise(r => setTimeout(r, 200));
        }
        alert("Hoàn tất quá trình nhập dữ liệu!");
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                     <h1 className="text-3xl font-bold font-serif flex items-center gap-3 text-slate-900 dark:text-white">
                        <Globe className="w-8 h-8 text-orange-500" />
                        Trình quét bản đồ (GIS Scanner)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Tự động thu thập dữ liệu địa điểm du lịch từ OpenStreetMap</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nguồn dữ liệu</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">OSM API</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Trạng thái</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Ready
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Configuration & Map (Left 8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Tọa độ tâm</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-xs">
                                        {center[0].toFixed(5)}, {center[1].toFixed(5)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Bán kính (m)</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:border-orange-500 transition-colors">
                                    <Radius className="w-4 h-4 text-orange-500" />
                                    <input
                                        type="number"
                                        value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="bg-transparent outline-none w-full font-bold text-slate-700 dark:text-slate-200 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleScan}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 dark:shadow-none disabled:bg-slate-300"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Bắt đầu quét
                                </button>
                            </div>
                        </div>

                        <div className="h-[550px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner">
                            <MapContainer center={center} zoom={14} className="h-full w-full z-0">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker position={center} setPosition={setCenter} />
                                <Circle center={center} radius={radius} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.1, weight: 2 }} />

                                {results.map((loc, idx) => (
                                    <Marker key={idx} position={[loc.latitude, loc.longitude]}>
                                        <Popup>
                                            <div className="font-bold text-slate-900 border-b pb-1 mb-1">{loc.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium italic">{loc.address}</div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                            <div className="absolute top-6 left-6 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <Navigation className="w-3 h-3 text-orange-500" /> Click bản đồ để chọn tâm
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scanned Results (Right 4 cols) */}
                <div className="lg:col-span-4 flex flex-col h-[750px]">
                     <div className="bg-white dark:bg-slate-900 rounded-3xl flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs flex items-center gap-2 tracking-widest">
                                <ListFilter className="w-4 h-4 text-orange-500" /> Danh sách ({results.length})
                            </h3>
                            {categoriesLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {results.length === 0 && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Database className="w-12 h-12 mb-4 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chưa có dữ liệu</p>
                                    <p className="text-xs text-slate-400 mt-2 px-8">Chọn một vị trí và nhấn quét để lấy dữ liệu từ OSM</p>
                                </div>
                            )}

                            {results.map((loc, idx) => {
                                const isAdded = successList.includes(loc.name);
                                return (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{loc.name}</h4>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{loc.address || "---"}</span>
                                                </div>
                                            </div>
                                            {isAdded ? (
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-900/50">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleImport(loc, idx)}
                                                    disabled={importing !== null || categoriesLoading}
                                                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-orange-600 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-orange-500 transition-all active:scale-95 disabled:opacity-30"
                                                >
                                                    {importing === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {results.length > 0 && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={handleImportAll}
                                    disabled={importing !== null}
                                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 dark:shadow-none">
                                    {importing !== null ? 'Đang xử lý...' : 'Nhập tất cả dữ liệu'}
                                </button>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
}
