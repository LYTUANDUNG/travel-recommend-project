import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto -mt-8 relative z-10">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm địa điểm: biển gần Sài Gòn, núi ở miền Bắc, resort 5 sao..."
              className="w-full pl-12 pr-4 py-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Tìm kiếm
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
          Ví dụ: "biển gần HCM", "núi ở Đà Lạt", "đảo có lặn san hô"
        </p>
      </div>
    </div>
  );
}