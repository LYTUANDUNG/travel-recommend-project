import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import SearchFilters from '../components/SearchFilters';
import { RecommendationResult, Location } from '../types';
import { useSmartRecommendations } from '../hooks/useSmartRecommendations';
import { useLocationStore } from '../store/useLocationStore';
import { fetchLocations } from '../api/client';
import { Search } from 'lucide-react';

export default function Recommend() {
  const [loading, setLoading] = useState(false);
  const { locations } = useLocationStore();
  // Reuse the smart hook
  const smartRecs = useSmartRecommendations(locations);

  const [results, setResults] = useState<RecommendationResult[]>([]);
  const { search } = useLocation();
  const query = new URLSearchParams(search).get('q');

  useEffect(() => {
    // If no query, use smart recs
    if (!query) {
      setResults(smartRecs.map(loc => ({
        location: loc,
        similarity: (loc.match_score || 80) / 100
      })));
      return;
    }

    // If query exists, keep existing search logic (simulated)
    setLoading(true);
    fetchLocations().then(locs => {
      // Mock similarity
      const scored = locs.map(loc => ({
        location: loc,
        similarity: Math.random() * 0.5 + 0.5
      })).sort((a, b) => b.similarity - a.similarity);

      setResults(scored);
    }).finally(() => setLoading(false));
  }, [query, smartRecs]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      {/* Header handled by Layout or included if needed, but Layout usually handles it */}
      {/* <Header /> */}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
              {query ? `Kết quả cho "${query}"` : 'Gợi ý cho bạn'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Tìm thấy {results.length} địa điểm phù hợp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <SearchFilters onFilterChange={(f) => console.log(f)} />

            {/* Map Preview Sticky */}
            <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 h-[300px]">
              <h3 className="font-bold mb-4 text-sm text-slate-700 dark:text-slate-300">Xem trên bản đồ</h3>
              <div className="h-full rounded-lg overflow-hidden">
                <MapView locations={results.map(r => r.location)} />
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((item) => (
                  <div key={item.location.location_id} className="relative group">
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-green-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                      {Math.round(item.similarity * 100)}% phù hợp
                    </div>
                    <LocationCard
                      location={item.location}
                      className="flex-row h-64 hover:-translate-y-1"
                      onClick={() => window.location.href = `/detail/${item.location.location_id}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}