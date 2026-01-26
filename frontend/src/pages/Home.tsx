import { useEffect } from 'react';
import Hero from '../components/Hero';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSmartRecommendations } from '../hooks/useSmartRecommendations';
import { fetchLocations } from '../api/client';
import { Search, Map, Compass, TrendingUp } from 'lucide-react';

export default function Home() {
  const { locations, setLocations, setLoading, loading } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();
  const recommendedLocations = useSmartRecommendations(locations);

  useEffect(() => {
    setLoading(true);
    fetchLocations()
      .then(setLocations)
      .finally(() => setLoading(false));
  }, []);

  const featuredLocations = locations.slice(0, 6); // Keep for "Featured" section

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <Hero />

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Quick Categories */}
          {[
            { name: 'Khách sạn', icon: <Map className="w-6 h-6 text-blue-500" /> },
            { name: 'Nhà hàng', icon: <Compass className="w-6 h-6 text-green-500" /> },
            { name: 'Di tích', icon: <Search className="w-6 h-6 text-orange-500" /> },
            { name: 'Giải trí', icon: <TrendingUp className="w-6 h-6 text-purple-500" /> },
          ].map((cat) => (
            <button key={cat.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="p-2 bg-slate-100 rounded-lg">{cat.icon}</div>
              <span className="font-medium text-slate-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 space-y-20">

        {/* Section: Recommended for You (Smart Logic for Both Guest & User) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                {isAuthenticated ? 'Gợi ý cho bạn' : 'Xu hướng hiện nay'}
              </h2>
              <p className="text-slate-700 font-medium">
                {isAuthenticated
                  ? `Dựa trên sở thích "${user?.interests.join(', ')}" của bạn`
                  : 'Những địa điểm được cộng đồng yêu thích nhất'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedLocations.map((loc) => (
              <LocationCard
                key={`rec-${loc.id}`}
                location={loc}
                userLat={10.762622}
                userLng={106.660172}
                onClick={() => window.location.href = `/detail/${loc.id}`}
                className="border-primary-100 ring-4 ring-primary-50"
              />
            ))}
          </div>
        </section>

        {/* Section 1: Top Destinations */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Địa điểm nổi bật</h2>
              <p className="text-slate-700 font-medium">Những điểm đến được yêu thích nhất bởi cộng đồng</p>
            </div>
            <a href="/explore" className="text-primary-600 font-medium hover:text-primary-700 hover:underline">Xem tất cả &rarr;</a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredLocations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  userLat={10.762622}
                  userLng={106.660172}
                  onClick={() => window.location.href = `/detail/${loc.id}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Map Discovery */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Khám phá qua bản đồ</h2>
            <p className="text-slate-500">Tìm kiếm địa điểm thú vị xung quanh bạn</p>
          </div>
          <div className="h-[500px] rounded-2xl overflow-hidden shadow-inner">
            <MapView locations={locations} />
          </div>
        </section>

      </div>
    </div>
  );
}