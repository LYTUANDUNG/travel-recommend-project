import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Map as MapIcon, Grid, MapPin } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import { useLocationStore } from '../store/useLocationStore';
import { useSmartRecommendations } from '../hooks/useSmartRecommendations';
import { externalApi, Province, OSMNode } from '../api/external';

export default function Explore() {
    const { locations } = useLocationStore();
    const recommendations = useSmartRecommendations(locations);
    const [activeCategory, setActiveCategory] = useState('All');

    // New States for Map Integration
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [pois, setPois] = useState<OSMNode[]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
    const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);

    const categories = ['All', 'Khách sạn', 'Nhà hàng', 'Di tích', 'Giải trí', 'Thiên nhiên'];

    // Load Provinces on Mount
    useEffect(() => {
        externalApi.getProvinces().then(data => {
            setProvinces(data);
        });
    }, []);

    // Handle Province Selection
    const handleProvinceChange = async (provinceName: string) => {
        setSelectedProvince(provinceName);
        if (provinceName) {
            // Find coordinates for province
            const coords = await externalApi.searchLocation(provinceName);
            if (coords) {
                setMapCenter([coords.lat, coords.lon]);
                setViewMode('map'); // Auto switch to map
            }
        }
    };

    // Debounce Ref for Map Move
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Better approach: Effect that listens to mapCenter changing or ViewMode
    // We already have handleMapMove. Let's make a dedicated fetcher.

    useEffect(() => {
        if (viewMode === 'map' && mapCenter) {
            const [lat, lng] = mapCenter;
            setIsLoadingPOIs(true);
            externalApi.getNearbyPOIs(lat, lng, activeCategory)
                .then(setPois)
                .finally(() => setIsLoadingPOIs(false));
        }
    }, [viewMode, activeCategory, mapCenter]); // When category changes, re-fetch

    // Update debounce logic to set mapCenter specifically for fetching
    const onMove = (center: { lat: number, lng: number }) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setMapCenter([center.lat, center.lng]); // This triggers the Effect above
        }, 800);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-20 pb-20">
            {/* Header Section */}
            <div className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Khám phá Việt Nam</h1>
                    <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                        Tìm kiếm những điểm đến hấp dẫn, văn hóa độc đáo và ẩm thực tuyệt vời dọc khắp đất nước.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="container mx-auto px-4 -mt-8 relative z-10">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-4 flex flex-col xl:flex-row gap-4 items-center justify-between border border-slate-100 dark:border-slate-800">

                    {/* Categories */}
                    <div className="flex overflow-x-auto gap-2 w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${activeCategory === cat
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
                        {/* Province Dropdown */}
                        <select
                            value={selectedProvince}
                            onChange={(e) => handleProvinceChange(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-48"
                        >
                            <option value="">Chọn Tỉnh/Thành</option>
                            {provinces.map(p => (
                                <option key={p.code} value={p.name}>{p.name}</option>
                            ))}
                        </select>

                        {/* Search Input */}
                        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm địa điểm..."
                                className="bg-transparent border-none outline-none text-slate-700 dark:text-white w-full md:w-48 placeholder:text-slate-400"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}`}
                            >
                                <MapIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-12">

                {viewMode === 'map' ? (
                    <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 relative">
                        {isLoadingPOIs && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Đang tìm quán ăn...</span>
                            </div>
                        )}
                        <MapView
                            locations={locations}
                            pois={pois}
                            center={mapCenter}
                            onMapMove={onMove}
                        />
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8 border-l-4 border-primary-600 pl-4">
                            {activeCategory === 'All' ? 'Tất cả địa điểm' : activeCategory}
                        </h2>

                        {/* Suggestions */}
                        {activeCategory === 'All' && (
                            <div className="mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {recommendations.slice(0, 2).map((loc) => (
                                        <LocationCard key={`explore-rec-${loc.location_id}`} location={loc} onClick={() => window.location.href = `/detail/${loc.location_id}`} className="ring-2 ring-green-100" />
                                    ))}
                                </div>
                                <div className="my-8 border-b border-slate-100" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {locations.map((loc) => (
                                <LocationCard key={loc.location_id} location={loc} onClick={() => window.location.href = `/detail/${loc.location_id}`} />
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <button className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Xem thêm
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
