import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface FilterState {
    category: string;
    priceRange: string;
    rating: number | null;
}

interface SearchFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    className?: string;
}

export default function SearchFilters({ onFilterChange, className }: SearchFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        category: 'all',
        priceRange: 'all',
        rating: null
    });

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const categories = [
        { id: 'all', label: 'Tất cả' },
        { id: 'nature', label: 'Thiên nhiên' },
        { id: 'culture', label: 'Văn hóa' },
        { id: 'food', label: 'Ẩm thực' },
        { id: 'hotel', label: 'Khách sạn' },
    ];

    const prices = [
        { id: 'all', label: 'Mọi mức giá' },
        { id: 'low', label: 'Tiết kiệm' },
        { id: 'medium', label: 'Trung bình' },
        { id: 'high', label: 'Cao cấp' },
    ];

    return (
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100 p-4", className)}>
            <div className="flex items-center justify-between mb-4 md:hidden">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Bộ lọc
                </h3>
                <button onClick={() => setIsOpen(!isOpen)} className="text-primary-600">
                    {isOpen ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>

            <div className={cn("space-y-6", isOpen ? "block" : "hidden md:block")}>
                {/* Categories */}
                <div>
                    <h4 className="font-medium text-slate-900 mb-3 text-sm">Loại hình</h4>
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="category"
                                    value={cat.id}
                                    checked={filters.category === cat.id}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                                />
                                <span className="text-slate-600 text-sm group-hover:text-primary-600 transition-colors">{cat.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Price Range */}
                <div>
                    <h4 className="font-medium text-slate-900 mb-3 text-sm">Khoảng giá</h4>
                    <div className="space-y-2">
                        {prices.map(price => (
                            <label key={price.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="price"
                                    value={price.id}
                                    checked={filters.priceRange === price.id}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                                />
                                <span className="text-slate-600 text-sm group-hover:text-primary-600 transition-colors">{price.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Rating */}
                <div>
                    <h4 className="font-medium text-slate-900 mb-3 text-sm">Đánh giá</h4>
                    <div className="flex gap-2">
                        {[5, 4, 3, 2, 1].map(star => (
                            <button
                                key={star}
                                onClick={() => handleFilterChange('rating', filters.rating === star ? null : star)}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border",
                                    filters.rating === star
                                        ? "bg-amber-100 text-amber-700 border-amber-300"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-500"
                                )}
                            >
                                {star}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {
                        handleFilterChange('rating', null);
                        handleFilterChange('category', 'all');
                        handleFilterChange('priceRange', 'all');
                    }}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Xóa bộ lọc
                </button>
            </div>
        </div>
    );
}
