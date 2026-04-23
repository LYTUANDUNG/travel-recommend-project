import { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, Star } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import { useLocationStore } from '../store/useLocationStore';
import { Location } from '../types/schema';
import { useSearchParams } from 'react-router-dom';

import { api } from '../api';

export default function Explore() {
    const [searchParams] = useSearchParams();
    
    // The value actually used for filtering
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    // The value bound to the input field
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    
    const [paginatedLocations, setPaginatedLocations] = useState<Location[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeCategory, setActiveCategory] = useState('All');
    const [priceFilter, setPriceFilter] = useState('All');
    const [ratingFilter, setRatingFilter] = useState<number>(0);
    const [provinceFilter, setProvinceFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Recommended');

    const [categories, setCategories] = useState<string[]>(['All']);
    const [provinces, setProvinces] = useState<string[]>(['All']);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 16;

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
            if (ratingFilter > 0) params.rating = ratingFilter;
            
            // Add sorting params
            if (sortBy === 'Rating') params.sort = 'averageRating,desc';
            else if (sortBy === 'Newest') params.sort = 'locationId,desc';

            const res = await api.location.getPaginated(params);
            if (res.success && res.data && Array.isArray(res.data.content)) {
                setPaginatedLocations(res.data.content);
                setTotalPages(res.data.total_pages || res.data.totalPages || 1);
                setTotalElements(res.data.total_elements || res.data.totalElements || 0);
            } else {
                setPaginatedLocations([]);
            }
            setIsLoading(false);
        };
        fetchLocations();
    }, [searchQuery, activeCategory, provinceFilter, priceFilter, ratingFilter, currentPage, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeCategory, provinceFilter, priceFilter, ratingFilter, sortBy]);

    const sortOptions = ['Recommended', 'Rating', 'Newest'];
    const priceRanges = ['All', 'Miễn phí', 'Dưới 100k', '100k - 500k', 'Trên 500k'];
    const ratings = [0, 5, 4, 3]; // 0 is All

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-24 pb-20">
            {/* Header Section Simplified */}
            <div className="container mx-auto px-4 mb-12">
                 <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 dark:bg-primary-900/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-tight">
                                Tìm kiếm <span className="text-primary-600">Trải nghiệm</span> mơ ước của bạn.
                            </h1>
                            <p className="text-slate-500 font-medium max-w-md">Sử dụng bộ lọc thông minh để tìm thấy điểm đến lý tưởng dựa trên sở thích và ngân sách.</p>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Điểm đến, hoạt động..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
                                    className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-primary-500/10 border-2 border-transparent focus:border-primary-500 font-bold text-lg transition-all"
                                />
                                <button 
                                    onClick={() => setSearchQuery(searchInput)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-slate-900 dark:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                >
                                    Tìm
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Filter Bar */}
            <div className="container mx-auto px-4 mb-12">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 border border-slate-100 dark:border-slate-800 relative">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                         {/* Province Filter */}
                         <div className="space-y-4">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-primary-500" /> Khu vực (Tỉnh thành)
                             </p>
                             <select 
                                value={provinceFilter}
                                onChange={(e) => setProvinceFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-300 outline-none border-2 border-transparent focus:border-primary-500 transition-all appearance-none cursor-pointer"
                             >
                                <option value="All">Toàn quốc / Tất cả</option>
                                {provinces.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                             </select>
                         </div>

                         {/* Price Filter */}
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <SlidersHorizontal className="w-3 h-3 text-emerald-500" /> Ngân sách
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Miễn phí', 'Dưới 100k', '100k - 500k', 'Trên 500k'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setPriceFilter(priceFilter === p ? 'All' : p)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${priceFilter === p ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                         </div>

                         {/* Sort Filter */}
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Star className="w-3 h-3 text-amber-500" /> Sắp xếp theo
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {sortOptions.map(opt => (
                                    <button 
                                        key={opt} 
                                        onClick={() => setSortBy(opt)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${sortBy === opt ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {opt === 'Recommended' ? 'Gợi ý nhất' : opt === 'Rating' ? 'Xếp hạng' : 'Mới nhất'}
                                    </button>
                                ))}
                            </div>
                         </div>

                         {/* Categories Chip List */}
                         <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-8">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Loại hình</p>
                                {(activeCategory !== 'All' || provinceFilter !== 'All' || priceFilter !== 'All' || ratingFilter !== 0) && (
                                    <button 
                                        onClick={() => {
                                            setActiveCategory('All');
                                            setProvinceFilter('All');
                                            setPriceFilter('All');
                                            setRatingFilter(0);
                                        }}
                                        className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                                    >
                                        Xóa lọc
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.filter(c => c !== 'All').slice(0, 6).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeCategory === cat ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        Hiển thị <span className="text-indigo-600">{totalElements}</span> kết quả
                    </h2>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Đang tải dữ liệu...</h3>
                    </div>
                ) : paginatedLocations.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy địa điểm phù hợp</h3>
                        <p className="text-slate-500 mt-2">Hãy thử thay đổi tiêu chí lọc hoặc từ khóa tìm kiếm.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {paginatedLocations.map((loc) => (
                                <LocationCard key={loc.location_id} location={loc} />
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm font-black"
                                >
                                    &lt;
                                </button>
                                <div className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-black text-slate-700 dark:text-200">
                                    {currentPage} <span className="text-slate-400 font-medium mx-1">/</span> {totalPages}
                                </div>
                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm font-black"
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
