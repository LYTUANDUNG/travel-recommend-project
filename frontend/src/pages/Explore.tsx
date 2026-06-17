import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, SlidersHorizontal, Sparkles } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import { Location } from '../types/schema';
import { useLocation, useSearchParams } from 'react-router-dom';
import MapView from '../components/MapView';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { api } from '../api';
import { haversineDistance } from '../utils/haversine';

export default function Explore() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { coords } = useGeoLocation();
    
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const isMapOnly = location.pathname === '/map' || searchParams.get('map') === 'true';
    
    const [paginatedLocations, setPaginatedLocations] = useState<Location[]>([]);
    const [allMapLocations, setAllMapLocations] = useState<Location[]>([]);
    const [radiusMeters, setRadiusMeters] = useState(2000);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
    const [priceFilter, setPriceFilter] = useState('All');
    const [provinceFilter, setProvinceFilter] = useState('All');

    const [categories, setCategories] = useState<string[]>(['All']);
    const [provinces, setProvinces] = useState<string[]>(['All']);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Perfect page sizing for split layout

    // GIS Coordinates Center & Zoom tracking
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
    const [mapZoom, setMapZoom] = useState<number>(12);

    useEffect(() => {
        api.category.getAll().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setCategories(['All', ...res.data.map((c: any) => c.name)]);
            }
        });
        api.location.getProvinces().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setProvinces(['All', ...res.data]);
            }
        });
    }, []);

    useEffect(() => {
        if (!isMapOnly) return;
        setIsLoading(true);
        api.location.getAll().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setAllMapLocations(res.data.filter(loc => loc.latitude && loc.longitude));
            } else {
                setAllMapLocations([]);
            }
        }).finally(() => setIsLoading(false));
    }, [isMapOnly]);

    useEffect(() => {
        if (isMapOnly) return;
        const fetchLocations = async () => {
            setIsLoading(true);
            const params: any = {
                page: currentPage - 1,
                size: ITEMS_PER_PAGE
            };
            if (searchQuery) params.query = searchQuery;
            if (activeCategory !== 'All') params.category = activeCategory;
            if (provinceFilter !== 'All') params.province = provinceFilter;
            if (priceFilter !== 'All') params.price = priceFilter;

            const res = await api.location.getPaginated(params);
            if (res.success && res.data && Array.isArray(res.data.content)) {
                setPaginatedLocations(res.data.content);
                setTotalPages(res.data.total_pages || res.data.totalPages || 1);
                setTotalElements(res.data.total_elements || res.data.totalElements || 0);
                
                // Autocenter camera on first item loaded if not already centered
                if (res.data.content.length > 0) {
                    const first = res.data.content[0];
                    if (first.latitude && first.longitude) {
                        setMapCenter([Number(first.latitude), Number(first.longitude)]);
                    }
                }
            } else {
                setPaginatedLocations([]);
            }
            setIsLoading(false);
        };
        fetchLocations();
    }, [searchQuery, activeCategory, provinceFilter, priceFilter, currentPage, isMapOnly]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeCategory, provinceFilter, priceFilter]);

    const handleCardHover = (loc: Location) => {
        if (loc.latitude && loc.longitude) {
            setMapCenter([Number(loc.latitude), Number(loc.longitude)]);
            setMapZoom(14);
        }
    };

    const radiusLocations = useMemo(() => {
        if (!coords) return allMapLocations;
        return allMapLocations.filter(loc => {
            if (!loc.latitude || !loc.longitude) return false;
            return haversineDistance(coords.lat, coords.lng, Number(loc.latitude), Number(loc.longitude)) * 1000 <= radiusMeters;
        });
    }, [allMapLocations, coords, radiusMeters]);

    if (isMapOnly) {
        return (
            <div className="space-y-6 font-sans pb-10 animate-in fade-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
                            <MapPin className="w-4 h-4" /> Bản đồ địa điểm
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Tất cả địa điểm trên bản đồ</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {coords
                                ? `Đang hiển thị ${radiusLocations.length}/${allMapLocations.length} địa điểm trong bán kính ${radiusMeters.toLocaleString('vi-VN')} mét.`
                                : `Đang hiển thị ${allMapLocations.length} địa điểm có tọa độ. Bật vị trí để lọc theo bán kính.`}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Bán kính</label>
                        <select
                            value={radiusMeters}
                            onChange={(e) => setRadiusMeters(Number(e.target.value))}
                            disabled={!coords}
                            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 outline-none border border-slate-100 dark:border-slate-700 disabled:opacity-50"
                        >
                            <option value={1000}>1.000 mét</option>
                            <option value={2000}>2.000 mét</option>
                            <option value={5000}>5.000 mét</option>
                            <option value={10000}>10.000 mét</option>
                            <option value={50000}>50.000 mét</option>
                        </select>
                    </div>
                </div>

                <div className="h-[calc(100vh-240px)] min-h-[520px] rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 bg-white p-2">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">Đang tải bản đồ...</div>
                    ) : (
                        <MapView
                            locations={coords ? radiusLocations : allMapLocations}
                            center={coords ? [coords.lat, coords.lng] : undefined}
                            zoom={coords ? 13 : 6}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans pb-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT PANEL: Searching controls & results grid */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Search header card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -mr-24 -mt-24 blur-2xl"></div>
                        <div className="relative z-10 space-y-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-[#f97316] rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    <Sparkles className="w-3.5 h-3.5" /> VinaTravel GIS Explorer
                                </div>
                                <h1 className="font-serif text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Khám Phá Điểm Đến
                                </h1>
                                <p className="text-slate-400 text-xs mt-1 font-medium">Tìm kiếm địa điểm du lịch, ẩm thực và khách sạn trên bản đồ trực quan.</p>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Bạn muốn đi đâu hôm nay?"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
                                    className="w-full pl-12 pr-32 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/85 rounded-xl outline-none focus:border-orange-500 focus:bg-white text-sm font-semibold transition-all text-slate-700 dark:text-slate-100"
                                />
                                <button 
                                    onClick={() => setSearchQuery(searchInput)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg font-bold text-xs transition-all shadow-sm shadow-orange-500/15"
                                >
                                    Tìm kiếm
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Smart filters panel */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Tỉnh thành */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-orange-500" /> Khu Vực Tỉnh Thành
                                </label>
                                <select
                                    value={provinceFilter}
                                    onChange={(e) => setProvinceFilter(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-350 outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/5 transition-all cursor-pointer"
                                >
                                    <option value="All">Tất cả Tỉnh Thành</option>
                                    {provinces.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            {/* Ngân sách */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3 h-3 text-orange-500" /> Ngân Sách
                                </label>
                                <select
                                    value={priceFilter}
                                    onChange={(e) => setPriceFilter(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-350 outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/5 transition-all cursor-pointer"
                                >
                                    <option value="All">Mọi phân khúc giá</option>
                                    {['Miễn phí', 'Dưới 100k', '100k - 500k', 'Trên 500k'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Loại hình */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-455 tracking-wider flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3 h-3 text-orange-500" /> Loại Hình
                                </label>
                                <select
                                    value={activeCategory}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-355 outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/5 transition-all cursor-pointer"
                                >
                                    <option value="All">Tất cả Loại Hình</option>
                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* List grid */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                Tìm thấy {totalElements} kết quả phù hợp
                            </h2>
                            {(activeCategory !== 'All' || provinceFilter !== 'All' || priceFilter !== 'All' || searchQuery !== '') && (
                                <button 
                                    onClick={() => {
                                        setActiveCategory('All');
                                        setProvinceFilter('All');
                                        setPriceFilter('All');
                                        setSearchQuery('');
                                        setSearchInput('');
                                    }}
                                    className="text-xs font-black text-rose-500 uppercase hover:underline"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f97316] mb-4"></div>
                                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">Đang tải danh sách địa điểm...</h3>
                            </div>
                        ) : paginatedLocations.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy địa điểm nào</h3>
                                <p className="text-slate-400 text-xs mt-1">Vui lòng thử thay đổi từ khóa hoặc bộ lọc tìm kiếm khác.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {paginatedLocations.map((loc) => (
                                        <LocationCard 
                                            key={loc.location_id} 
                                            location={loc} 
                                            userLat={coords?.lat}
                                            userLng={coords?.lng}
                                            onMouseEnter={() => handleCardHover(loc)}
                                        />
                                    ))}
                                </div>

                                {/* Pagination UI */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-3 mt-6">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all font-bold shadow-sm"
                                        >
                                            &lt;
                                        </button>
                                        <div className="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200">
                                            {currentPage} / {totalPages}
                                        </div>
                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all font-bold shadow-sm"
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Leaflet GIS Map container sticky */}
                <div className="lg:col-span-6 lg:sticky lg:top-24 h-[calc(100vh-160px)] min-h-[560px] rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 z-10">
                    <MapView 
                        locations={paginatedLocations} 
                        center={mapCenter} 
                        zoom={mapZoom}
                    />
                </div>
            </div>
        </div>
    );
}
