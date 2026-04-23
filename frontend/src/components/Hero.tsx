import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        if (query.trim()) {
            navigate(`/recommend?q=${encodeURIComponent(query)}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image & Gradient */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Vietnam Landscape"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center mt-16">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg tracking-tight">
                    Khám phá vẻ đẹp <br />
                    <span className="text-primary-300">Việt Nam</span>
                </h1>

                <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-md">
                    Lên kế hoạch cho chuyến đi hoàn hảo của bạn với những điểm đến hấp dẫn nhất.
                </p>

                {/* Search Bar Container */}
                <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
                    <div className="bg-white rounded-xl p-2 flex flex-col md:flex-row items-center gap-2">
                        <div className="flex-1 w-full flex items-center px-4 h-12 border-b md:border-b-0 md:border-r border-slate-100">
                            <Search className="w-5 h-5 text-slate-400 mr-3" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Bạn muốn đi đâu?"
                                className="w-full bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="w-px h-8 bg-slate-200 hidden md:block" />

                        <button
                            onClick={handleSearch}
                            className="w-full md:w-auto px-8 h-12 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-primary-600/30 flex items-center justify-center gap-2"
                        >
                            Khám phá ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
                <div className="w-8 h-12 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
                    <div className="w-1 h-3 bg-white rounded-full" />
                </div>
            </div>
        </div>
    );
}
