import { useEffect } from 'react';
import Hero from '../components/Hero';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSmartRecommendations } from '../hooks/useSmartRecommendations';
import { useContextRecommendation } from '../hooks/useContextRecommendation'; // Context Hook
import { api } from '../api';
import { Search, Map, Compass, TrendingUp, CloudRain, Sun, Coffee, User, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';
import SmartItineraryWidget from '../components/SmartItineraryWidget';

export default function Home() {
  const { locations, setLocations, setLoading, loading } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();
  const recommendedLocations = useSmartRecommendations(locations);

  // Smart Context Data
  const { recommendation: contextRec, isLoading: isContextLoading } = useContextRecommendation();

  useEffect(() => {
    setLoading(true);
    // Use new API Layer
    api.location.getAll()
      .then(res => setLocations(res.data))
      .finally(() => setLoading(false));
  }, []);

  const featuredLocations = locations.slice(0, 6); // Keep for "Featured" section

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-200/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-secondary-200/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* 1. Header Hero (Condensed) */}
      {!isAuthenticated && <Hero />}

      <div className={cn("container mx-auto px-4 relative z-10 space-y-8", isAuthenticated ? "pt-24" : "-mt-10")}>

        {/* DASHBOARD GRID (Only for Logged In Users) */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Context & Itinerary (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Header */}
              <div className="glass p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                    Chào {user?.full_name || 'Nhà lữ hành'}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">hôm nay đi đâu?</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Hệ thống đã chuẩn bị vài gợi ý hay ho cho bạn.</p>
                </div>
                {user?.avatar_url && (
                  <img src={user.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                )}
              </div>

              {/* Context Banner */}
              {contextRec && (
                <div className={cn(
                  "rounded-2xl shadow-xl p-8 text-white flex items-center justify-between overflow-hidden relative transition-all group",
                  contextRec.contextType === 'RAIN' ? "bg-gradient-to-br from-slate-800 to-slate-600" :
                    contextRec.contextType === 'SUN' ? "bg-gradient-to-br from-orange-400 to-pink-500" :
                      "bg-gradient-to-br from-blue-500 to-indigo-600"
                )}>
                  {/* Background Noise/Texture */}
                  <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 glass rounded-full flex items-center justify-center text-2xl shadow-lg">
                        {contextRec.icon}
                      </div>
                      <h3 className="text-2xl font-serif font-bold">{contextRec.message}</h3>
                    </div>
                    <p className="text-white/90 font-medium text-lg max-w-md leading-relaxed">
                      {contextRec.weatherDescription} ({contextRec.temperature}°C) &bull; {contextRec.subMessage}
                    </p>
                    <button className="mt-6 px-6 py-2.5 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                      <span>Xem gợi ý chi tiết</span>
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Decorative Icon BG */}
                  <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    {contextRec.contextType === 'RAIN' ? <CloudRain size={220} /> :
                      contextRec.contextType === 'SUN' ? <Sun size={220} /> : <Compass size={220} />}
                  </div>
                </div>
              )}

              {/* Activity Categories (Glass Cards) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Khách sạn', icon: <Map className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50' },
                  { name: 'Nhà hàng', icon: <Compass className="w-6 h-6 text-emerald-500" />, color: 'bg-emerald-50' },
                  { name: 'Di tích', icon: <Search className="w-6 h-6 text-amber-500" />, color: 'bg-amber-50' },
                  { name: 'Giải trí', icon: <TrendingUp className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50' },
                ].map((cat) => (
                  <button key={cat.name} className="glass p-4 rounded-xl flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className={cn("p-3 rounded-full transition-colors group-hover:bg-white", cat.color)}>{cat.icon}</div>
                    <span className="font-bold text-slate-700 text-sm group-hover:text-primary-600 transition-colors">{cat.name}</span>
                  </button>
                ))}
              </div>

            </div>

            {/* Right Column: Personal Stats & Itinerary (1/3 width) */}
            <div className="space-y-6">
              {/* Smart Itinerary */}
              <SmartItineraryWidget context={contextRec} />
            </div>
          </div>
        )}

        {/* Guest View: Standard Hero Banners */}
        {!isAuthenticated && contextRec && (
          // [Previous Guest Banner Logic if needed, or simplified]
          <div className="glass rounded-xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Quick Categories for Guest */}
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
        )}

      </div>

      <div className="container mx-auto px-4 py-16 space-y-20 relative z-10">

        {/* Section: Recommended for You (Smart Logic for Both Guest & User) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-3 rounded-2xl text-white shadow-lg shadow-primary-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                {isAuthenticated ? 'Gợi ý dành riêng cho bạn' : 'Xu hướng hiện nay'}
              </h2>
              <p className="text-slate-600 font-medium">
                {isAuthenticated
                  ? "Được cá nhân hóa bởi AI dựa trên sở thích và thời tiết"
                  : 'Những địa điểm được cộng đồng yêu thích nhất'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedLocations.map((loc) => (
              <LocationCard
                key={`rec-${loc.location_id}`}
                location={loc}
                userLat={10.762622}
                userLng={106.660172}
                onClick={() => window.location.href = `/detail/${loc.location_id}`}
                className="ring-2 ring-primary-50 hover:ring-4 hover:ring-primary-100"
              />
            ))}
          </div>
        </section>

        {/* Section 1: Top Destinations */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Địa điểm nổi bật</h2>
              <p className="text-slate-600 font-medium">Top những nơi nhất định phải đến</p>
            </div>
            <a href="/explore" className="text-primary-600 font-bold hover:text-primary-700 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </a>
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
                  key={loc.location_id}
                  location={loc}
                  userLat={10.762622}
                  userLng={106.660172}
                  onClick={() => window.location.href = `/detail/${loc.location_id}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Map Discovery */}
        <section className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="mb-6 relative z-10">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Khám phá qua bản đồ</h2>
            <p className="text-slate-500">Tìm kiếm địa điểm thú vị xung quanh bạn</p>
          </div>
          <div className="h-[500px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            <MapView locations={locations} />
          </div>
        </section>

      </div>
    </div>
  );
}

// Add ArrowRight import if missing (It was used in my code but needed import)
// Actually I need to check imports.
// Step 5: Check imports carefully.
