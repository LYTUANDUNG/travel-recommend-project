import { useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import { useLocationStore } from '../store/useLocationStore';
import { useSmartRecommendations } from '../hooks/useSmartRecommendations';

export default function Explore() {
    const { locations } = useLocationStore();
    const recommendations = useSmartRecommendations(locations);
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Khách sạn', 'Nhà hàng', 'Di tích', 'Giải trí', 'Thiên nhiên'];

    return (
        <div className="bg-slate-50 min-h-screen pt-20 pb-20">
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
                <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-100">
                    <div className="flex overflow-x-auto gap-2 w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${activeCategory === cat
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm địa điểm..."
                            className="bg-transparent border-none outline-none text-slate-700 w-full md:w-64 placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-8 border-l-4 border-primary-600 pl-4">
                    {activeCategory === 'All' ? 'Tất cả địa điểm' : activeCategory}
                </h2>

                {/* Optional: Show suggestions first if 'All' is selected */}
                {activeCategory === 'All' && (
                    <div className="mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommendations.slice(0, 2).map((loc) => (
                                <LocationCard key={`explore-rec-${loc.id}`} location={loc} onClick={() => window.location.href = `/detail/${loc.id}`} className="ring-2 ring-green-100" />
                            ))}
                        </div>
                        <div className="my-8 border-b border-slate-100" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {locations.map((loc) => (
                        <LocationCard key={loc.id} location={loc} onClick={() => window.location.href = `/detail/${loc.id}`} />
                    ))}
                    {/* Mock more content if needed */}
                    {locations.map((loc) => (
                        <LocationCard key={`${loc.id}-dup`} location={{ ...loc, id: loc.id + 100 }} onClick={() => window.location.href = `/detail/${loc.id}`} />
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                        Xem thêm
                    </button>
                </div>
            </div>
        </div>
    );
}
