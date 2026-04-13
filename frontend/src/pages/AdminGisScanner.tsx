import { useState, useEffect } from 'react';
import { api } from '../api';
import { MapPin, Search, Loader2, Save, Map as MapIcon, CheckCircle2, Radius, Sparkles, Navigation, Globe, ListFilter, Trash2 } from 'lucide-react';
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
                <div className="font-black text-indigo-600 text-xs uppercase tracking-widest">Tọa độ quét hiện tại</div>
                <div className="font-mono font-bold mt-1"> {position[0].toFixed(6)}, {position[1].toFixed(6)}</div>
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

    useEffect(() => {
        api.category.getAll().then(res => {
            if (res.success) setCategories(res.data);
        });
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
                // Automate: Reverse geocode for missing addresses, limit to 50 items to avoid DB freeze
                const enhanced = await Promise.all(scannedData.slice(0, 50).map(async (loc: any) => {
                    if (!loc.address || loc.address === 'Chưa xác định') {
                        try {
                            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}`, {
                                headers: {
                                    'User-Agent': 'TravelApp_Thesis_Project/1.0 (lydung853@gmail.com)'
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
            alert("Lỗi khi quét địa điểm");
        }
        setLoading(false);
    };

    const handleImport = async (loc: any, index: number) => {
        setImporting(index);
        try {
            const locCat = (loc.categoryName || "").toLowerCase();
            const matchedCat = categories.find((c: any) =>
                c.name.toLowerCase() === locCat ||
                (locCat === "restaurant" && c.name.toLowerCase().includes("nhà hàng")) ||
                (locCat === "cafe" && c.name.toLowerCase().includes("cà phê")) ||
                (locCat === "hotel" && c.name.toLowerCase().includes("khách sạn"))
            );

            const payload = {
                name: loc.name,
                description: loc.description,
                address: loc.address,
                latitude: loc.latitude,
                longitude: loc.longitude,
                province: loc.province || "Đà Nẵng",
                category_id: matchedCat ? matchedCat.category_id : (categories.length > 0 ? categories[0].category_id : 1),
                price_level: 2,
                price_range_str: loc.priceRangeStr || "100k - 500k",
                opening_hour: loc.openingHour || "08:00",
                closing_hour: loc.closingHour || "22:00",
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
            console.error("GIS Import failed", error.response?.data || error.message);
            alert("Lỗi khi thêm địa điểm: " + (error.response?.data?.message || error.message));
        }
        setImporting(null);
    };

    const handleImportAll = async () => {
        if (results.length === 0) return;
        if (!confirm(`Bạn muốn import ${results.length} địa điểm này vào hệ thống? Quá trình sẽ chạy lần lượt để bảo vệ Database.`)) return;

        for (let i = 0; i < results.length; i++) {
            const loc = results[i];
            if (successList.includes(loc.name)) continue;

            await handleImport(loc, i);
            await new Promise(r => setTimeout(r, 300));
        }

        alert("Đã import xong toàn bộ!");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 pt-6">
                <div>
                     <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Globe className="w-8 h-8 text-primary-500" />
                        Trình quét bản đồ (GIS Scanner)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Bố sung dữ liệu địa điểm du lịch bằng OpenStreetMap</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nguồn dữ liệu</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">OpenStreetMap (OSM)</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trạng thái</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Đang trực tuyến
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 pb-8">
                {/* Configuration & Map (Left 8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Tọa độ tâm quét</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-xs">
                                        {center[0].toFixed(5)}, {center[1].toFixed(5)}
                                    </span>
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Bán kính quét (m)</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <Radius className="w-4 h-4 text-indigo-500" />
                                    <input
                                        type="number"
                                        value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="bg-transparent outline-none w-full font-bold text-slate-700 dark:text-slate-200 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1 flex items-end">
                                <button
                                    onClick={handleScan}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-wide text-xs hover:bg-primary-700 transition-colors disabled:bg-slate-400"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Quét khu vực
                                </button>
                            </div>
                        </div>

                        <div className="h-[550px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
                            <MapContainer center={center} zoom={14} className="h-full w-full">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker position={center} setPosition={setCenter} />
                                <Circle center={center} radius={radius} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.1, weight: 2 }} />

                                {results.map((loc, idx) => (
                                    <Marker key={idx} position={[loc.latitude, loc.longitude]}>
                                        <Popup>
                                            <div className="font-black text-slate-900 border-b pb-1 mb-1 uppercase tracking-tight">{loc.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium italic">{loc.address}</div>
                                            <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-black text-center cursor-pointer hover:bg-indigo-100 transition-colors">QUÉT CƠ SỞ DỮ LIỆU</div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                            <div className="absolute top-6 left-6 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-2 ring-white">
                                <Navigation className="w-3 h-3 text-indigo-500" /> Click để di chuyển tâm quét
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scanned Results (Right 4 cols) */}
                <div className="lg:col-span-4 h-[720px]">
                     <div className="bg-white dark:bg-slate-900 rounded-2xl flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-sm flex items-center gap-2">
                                <ListFilter className="w-4 h-4 text-primary-500" /> Kết quả danh sách
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black">{results.length} MỤC</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                            {results.length === 0 && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                                    <Sparkles className="w-16 h-16 mb-4 text-slate-300" />
                                    <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">Sẵn sàng để quét</p>
                                    <p className="text-xs font-bold text-slate-400 mt-2 px-8">Chọn một vị trí trên bản đồ để bắt đầu thu thập dữ liệu</p>
                                </div>
                            )}

                            {results.map((loc, idx) => {
                                const isAdded = successList.includes(loc.name);
                                return (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{loc.name}</h4>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    <span className="truncate max-w-[150px]">{loc.address || "Chưa xác định"}</span>
                                                </div>
                                            </div>
                                            {isAdded ? (
                                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-900/50 shadow-sm animate-in zoom-in duration-300">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleImport(loc, idx)}
                                                    disabled={importing !== null}
                                                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary-600 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 transition-colors"
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
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 border-b-0 rounded-b-2xl cursor-pointer">
                                <button
                                    onClick={handleImportAll}
                                    disabled={importing !== null}
                                    className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-wide text-xs hover:bg-primary-700 transition-colors disabled:bg-slate-400">
                                    {importing !== null ? 'Đang Import...' : 'Thêm tất cả vào kho'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
