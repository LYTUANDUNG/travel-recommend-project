import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, 
    MapPin, 
    SlidersHorizontal, 
    Sparkles,
    Compass,
    UtensilsCrossed,
    Soup,
    Coffee,
    Beer,
    Pizza,
    Cake,
    Church,
    Flower2,
    Wallet
} from 'lucide-react';
import LocationCard from '../components/LocationCard';
import { Location } from '../types/schema';
import { useLocation, useSearchParams } from 'react-router-dom';
import MapView from '../components/MapView';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { api } from '../api';
import { haversineDistance } from '../utils/haversine';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../utils/cn';

interface CategoryTemplate {
    name: string;
    icon: any;
    color: string;
    bgColor: string;
    fallbackCount?: number;
}

const categoryTemplates: CategoryTemplate[] = [
    { name: 'Nhà hàng', icon: UtensilsCrossed, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30', fallbackCount: 6 },
    { name: 'Quán ăn', icon: Soup, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', fallbackCount: 16 },
    { name: 'Quán cà phê', icon: Coffee, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30', fallbackCount: 4 },
    { name: 'Quán nhậu / Bar', icon: Beer, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30', fallbackCount: 8 },
    { name: 'Đồ ăn nhanh', icon: Pizza, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', fallbackCount: 9 },
    { name: 'Tiệm bánh', icon: Cake, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30', fallbackCount: 1 },
    { name: 'Nhà thờ', icon: Church, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30', fallbackCount: 1 },
    { name: 'Tịnh thất', icon: Flower2, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', fallbackCount: 1 }
];

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
    const [activeCategories, setActiveCategories] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<string[]>(['All']);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
    const [mapZoom, setMapZoom] = useState<number>(12);

    // Smart search debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        api.category.getActive().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setActiveCategories(res.data);
            }
        });
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

    const getLocCount = (catName: string) => {
        const activeCat = activeCategories.find((c: any) => 
            c.name?.toLowerCase().includes(catName.toLowerCase()) ||
            catName.toLowerCase().includes(c.name?.toLowerCase())
        );
        if (activeCat) {
            const count = activeCat.location_count !== undefined ? activeCat.location_count : activeCat.locationCount;
            if (count !== undefined && count !== null) {
                return count;
            }
        }
        const template = categoryTemplates.find(t => 
            t.name.toLowerCase().includes(catName.toLowerCase()) ||
            catName.toLowerCase().includes(t.name.toLowerCase())
        );
        return template?.fallbackCount || 0;
    };

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
            <div className="space-y-6 pb-10 animate-in fade-in duration-500">
                <Card variant="raised" padding="md" className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1">
                            <MapPin className="w-4 h-4" /> Bản đồ địa điểm
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Tất cả địa điểm trên bản đồ</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {coords
                                ? `Hiển thị ${radiusLocations.length}/${allMapLocations.length} địa điểm trong bán kính ${radiusMeters.toLocaleString('vi-VN')} m.`
                                : `Hiển thị ${allMapLocations.length} địa điểm.`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase text-slate-400">Bán kính</span>
                        <select
                            value={radiusMeters}
                            onChange={(e) => setRadiusMeters(Number(e.target.value))}
                            disabled={!coords}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-full font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-200 outline-none cursor-pointer"
                        >
                            <option value={1000}>1.000 m</option>
                            <option value={2000}>2.000 m</option>
                            <option value={5000}>5.000 m</option>
                            <option value={10000}>10.000 m</option>
                        </select>
                    </div>
                </Card>

                <div className="h-[calc(100vh-240px)] min-h-[520px] rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-white p-2">
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
        <div className="pb-10 animate-in fade-in duration-500">
            {/* Split layout: 60% Left, 40% Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: List (60% width equivalent to 7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    
                    {/* Search & Scientific Pill Filters Card */}
                    <Card variant="raised" padding="md" className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight font-sans">
                                Khám phá theo nhu cầu
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Hệ thống tự động gợi ý và hiển thị địa điểm theo nhu cầu thực tế của bạn.
                            </p>
                        </div>

                        {/* Large Smart Search Input (No duplicate button - Debounced instant search) */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm địa điểm du lịch, ăn uống, tham quan..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 focus:bg-white text-sm font-semibold transition-all text-slate-850 dark:text-slate-100 shadow-sm"
                            />
                        </div>

                        {/* Loai hinh - Scientific Pills */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                            {/* All Option */}
                            <button
                                onClick={() => setActiveCategory('All')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all duration-300",
                                    activeCategory === 'All'
                                        ? "bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/15"
                                        : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:scale-[1.02]"
                                )}
                            >
                                <Compass className="w-4 h-4 shrink-0" />
                                <span>Tất cả</span>
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1",
                                    activeCategory === 'All' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                )}>
                                    53
                                </span>
                            </button>

                            {categoryTemplates.map(cat => {
                                const Icon = cat.icon;
                                const count = getLocCount(cat.name);
                                const isSelected = activeCategory === cat.name;

                                return (
                                    <button
                                        key={cat.name}
                                        onClick={() => setActiveCategory(cat.name)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all duration-300",
                                            isSelected
                                                ? "bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/15"
                                                : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:scale-[1.02]"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                            isSelected ? "bg-white/20" : cat.bgColor
                                        )}>
                                            <Icon className={cn("w-3 h-3", isSelected ? "text-white" : cat.color)} />
                                        </div>
                                        <span>{cat.name}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1",
                                            isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Side-by-side dropdown selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                            {/* Tỉnh thành */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
                                    <MapPin className="w-3.5 h-3.5 text-primary-500" /> Khu vực
                                </label>
                                <select
                                    value={provinceFilter}
                                    onChange={(e) => setProvinceFilter(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 outline-none cursor-pointer focus:border-primary-500 focus:bg-white transition-all"
                                >
                                    {provinces.map(prov => (
                                        <option key={prov} value={prov}>
                                            {prov === 'All' ? 'Tất cả khu vực' : prov}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ngân sách */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
                                    <Wallet className="w-3.5 h-3.5 text-primary-500" /> Ngân sách
                                </label>
                                <select
                                    value={priceFilter}
                                    onChange={(e) => setPriceFilter(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 outline-none cursor-pointer focus:border-primary-500 focus:bg-white transition-all"
                                >
                                    {['All', 'Miễn phí', 'Dưới 100k', '100k - 500k', 'Trên 500k'].map(budget => (
                                        <option key={budget} value={budget}>
                                            {budget === 'All' ? 'Tất cả mức giá' : budget}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Results Container */}
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-sm font-bold text-slate-550 uppercase tracking-wider">
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
                                    className="text-xs font-bold text-rose-500 uppercase hover:underline"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 shadow-sm flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
                                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">Đang tải danh sách địa điểm...</h3>
                            </div>
                        ) : paginatedLocations.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 shadow-sm">
                                <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Không tìm thấy địa điểm nào</h3>
                                <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {paginatedLocations.map((loc) => (
                                        <LocationCard 
                                            key={loc.location_id} 
                                            location={loc} 
                                            userLat={coords?.lat}
                                            userLng={coords?.lng}
                                            onMouseEnter={() => handleCardHover(loc)}
                                            className="w-full h-full"
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-3 mt-4">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all font-bold shadow-sm"
                                        >
                                            &lt;
                                        </button>
                                        <div className="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-full shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200">
                                            {currentPage} / {totalPages}
                                        </div>
                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all font-bold shadow-sm"
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive GIS Leaflet Map (40% width equivalent to 5 cols) */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 h-[calc(100vh-160px)] min-h-[560px] rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-white dark:bg-slate-900 p-2 z-10">
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
