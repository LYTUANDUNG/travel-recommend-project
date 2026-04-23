import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRecommendations } from '../hooks/useRecommendations';
import { api } from '../api';
import { Search, Map, MapPin, Compass, TrendingUp, User, ArrowRight } from 'lucide-react';
import OnboardingModal from '../components/OnboardingModal';
import { useGeoLocation } from '../hooks/useGeoLocation';

export default function Home() {
  const { locations, setLocations, setLoading, loading } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();
  const { recommendations, loading: recLoading } = useRecommendations();
  
  // 3 AI Approach Fix: Contextual Recommendations
  const { coords } = useGeoLocation();
  const [nearbyRecommendations, setNearbyRecommendations] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States
  const [newestLocations, setNewestLocations] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [activeCategories, setActiveCategories] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // Fetch Active Categories (Joined with locations)
    api.category.getActive().then(res => {
        if (res.success) {
            setActiveCategories(res.data.slice(0, 6));
        }
    });

    api.location.getPaginated({ page: 0, size: 50 }).then(res => {
        if (res.success && res.data) {
            setLocations(res.data.content);
        }
    }).finally(() => setLoading(false));

    // Fetch Newest Locations
    api.location.getPaginated({ page: 0, size: 4, sort: 'locationId,desc' }).then(res => {
        if (res.success && res.data) {
            setNewestLocations(res.data.content.length > 0 ? res.data.content : [...res.data.content].reverse().slice(0, 4));
        }
    });

    // Fetch Blogs
    api.blog.getAll().then(res => {
        if (res.success && res.data) {
            const blogData = Array.isArray(res.data) ? res.data : ((res.data as any).content || []);
            setBlogs(blogData.slice(0, 3));
        }
    });
    
    // Fetch Active Banners
    api.client.get('/banners/active').then(res => {
        if (res.data?.success && res.data.data.length > 0) {
            setBanners(res.data.data);
        } else {
            setBanners([
                { id: 'dev1', title: 'Khám phá thế giới cùng Travel', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800' },
                { id: 'dev2', title: 'Ưu đãi đặt vé trải nghiệm bay 50%', image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05' }
            ]);
        }
    }).catch(() => {
        setBanners([
            { id: 'dev1', title: 'Khám phá thế giới cùng Travel', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800' }
        ]);
    });
  }, []);

  // Fetch Nearby Contextual Recommendations
  useEffect(() => {
    if (coords) {
        setNearbyLoading(true);
        api.location.getPersonalizedRecommendations(coords.lat, coords.lng, new Date().getHours(), 'Cloudy')
            .then(res => {
                if (res.success) {
                    setNearbyRecommendations(res.data.slice(0, 4));
                }
            })
            .finally(() => setNearbyLoading(false));
    }
  }, [coords]);

  // Banner Auto-Slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Check For New Users (Cold Start AI Fix)
  useEffect(() => {
      if (isAuthenticated && user) {
          const userId = user.user_id;
          const hasSeen = localStorage.getItem(`onboarded_${userId}`);
          if (!hasSeen) {
              api.user.getInterests(userId).then(res => {
                  if (res.success && res.data.length === 0) {
                      setShowOnboarding(true);
                  } else {
                      localStorage.setItem(`onboarded_${userId}`, 'true');
                  }
              });
          }
      }
  }, [isAuthenticated, user]);

  const handleCloseOnboarding = () => {
      setShowOnboarding(false);
      if (user) localStorage.setItem(`onboarded_${user.user_id}`, 'true');
  };

  const featuredLocations = locations.slice(0, 8); 

  return (
    <div className="min-h-screen pb-20 bg-[#FFFEFA] dark:bg-slate-950 transition-colors duration-700">
      {/* 1. Cinematic Hero - Advanced Premium Layout */}
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="relative w-full h-[500px] lg:h-[650px] overflow-hidden rounded-[2.5rem] shadow-2xl">
          {/* Dynamic Background Elements */}
          <div className="absolute inset-0 z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-400/20 blur-[150px] rounded-full animate-pulse-soft" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-400/20 blur-[150px] rounded-full animate-pulse-soft" style={{ animationDelay: '2s' }} />
          </div>

          {banners.map((b, idx) => (
              <div 
                  key={b.id} 
                  className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                  <img 
                    src={b.image_url || b.imageUrl} 
                    alt={b.title} 
                    className="w-full h-full object-cover scale-105 animate-in fade-in zoom-in-110 duration-1000" 
                  />
                  
                  {/* Cinematic Overlays */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-black/20" />

                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-20">
                      <div className="max-w-4xl animate-in slide-in-from-bottom-12 duration-1000">
                          <h1 className="text-5xl md:text-7xl font-sans font-bold text-white mb-6 tracking-tight drop-shadow-md">
                            Khám phá. Trải nghiệm. Lên đường!
                          </h1>
                          <p className="text-white/90 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto drop-shadow-sm">
                            Khám phá những điểm đến tuyệt đẹp, trải nghiệm độc đáo và lên kế hoạch cho chuyến đi hoàn hảo của bạn ngay hôm nay!
                          </p>
                      </div>
                  </div>
              </div>
          ))}
        </div>

        {/* Functional Dribbble Style Search Bar */}
        <div className="relative z-30 -mt-16 w-full max-w-5xl mx-auto px-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-left">
                                {/* Categories Tabs (Real Functionality) */}
                                <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 overflow-x-auto custom-scrollbar">
                                    <button 
                                        className="flex items-center gap-2 text-sm font-bold text-[#0070F3] border-b-2 border-[#0070F3] pb-4 -mb-[17px] whitespace-nowrap"
                                        onClick={() => navigate('/explore')}
                                    >
                                        <Compass className="w-4 h-4" />
                                        Tất cả
                                    </button>
                                    {(activeCategories.length > 0 ? activeCategories : [
                                      { name: 'Khách sạn', id: 1 },
                                      { name: 'Nhà hàng', id: 2 },
                                      { name: 'Cà phê', id: 3 },
                                      { name: 'Văn hóa', id: 4 },
                                    ]).map(cat => (
                                        <button 
                                            key={cat.id || cat.name}
                                            onClick={() => navigate(`/explore?category=${cat.name}`)}
                                            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 pb-4 -mb-[17px] whitespace-nowrap transition-colors"
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Search Input (Real Functionality) */}
                                <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-0 mt-6">
                                    <div className="flex-1 w-full flex items-center px-4 py-2">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full mr-4 text-[#0070F3]">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-slate-800 dark:text-white mb-1 uppercase tracking-wider">Bạn muốn đi đâu?</div>
                                            <input 
                                                type="text" 
                                                placeholder="Tìm kiếm kho báu thiên nhiên..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && navigate(`/explore?q=${searchQuery}`)}
                                                className="w-full bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-400 placeholder:font-normal"
                                            />
                                        </div>
                                        
                                        <button 
                                            onClick={() => navigate(`/explore?q=${searchQuery}`)}
                                            className="ml-4 px-10 py-4 bg-[#0070F3] hover:bg-[#005bb5] text-white rounded-full font-bold text-sm hover:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30"
                                        >
                                            <Search className="w-5 h-5" /> Tìm kiếm
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Quick Link */}
                            {user?.role === 'ADMIN' && (
                                <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-top-4 duration-1000 delay-500">
                                    <button 
                                        onClick={() => navigate('/admin/dashboard')}
                                        className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/20 transition-all shadow-xl"
                                    >
                                        <Compass className="w-4 h-4 text-primary-400" /> Quản trị hệ thống
                                    </button>
                                </div>
                            )}
                        </div>
      </div>

      <div className="container mx-auto px-4 relative z-30">

        {/* Personalized Journey (Collaborative AI) */}
        {isAuthenticated && recommendations.length > 0 && (
            <section className="mb-20">
               <div className="mb-8 flex justify-between items-end">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        Gợi ý dành riêng cho {user?.full_name}
                      </h2>
                      <p className="text-slate-500 font-medium">Những địa điểm tuyệt vời nhất dành riêng cho bạn.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.slice(0,4).map((loc: any) => (
                      <LocationCard key={`rec-${loc.location_id || loc.id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
                  ))}
              </div>
            </section>
        )}

        {/* Nearby Recommendations (Contextual AI) */}
        {coords && nearbyRecommendations.length > 0 && (
            <section className="mb-20">
               <div className="mb-8 flex justify-between items-end">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-primary-600" /> Địa điểm quanh bạn
                      </h2>
                      <p className="text-slate-500 font-medium">Khám phá những kho báu ngay gần vị trí hiện tại của bạn.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {nearbyRecommendations.map((loc: any) => (
                      <LocationCard key={`nearby-${loc.location_id || loc.id}`} location={loc} userLat={coords.lat} userLng={coords.lng} />
                  ))}
              </div>
            </section>
        )}

        {/* Section: Trending / Popular */}
        <section className="mb-20 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                 <TrendingUp className="w-6 h-6 text-rose-500" /> Điểm đến nổi bật nhất
              </h2>
            </div>
            <a href="/explore" className="text-primary-600 font-bold hover:underline py-2 text-sm flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
               ))}
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {featuredLocations.map((loc) => (
                 <LocationCard key={loc.location_id} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
               ))}
             </div>
          )}
        </section>

        {/* Section: New Arrivals */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                 Vừa mới đăng tải
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Những địa điểm mới nhất vừa được bổ sung vào hệ thống.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {newestLocations.length > 0 ? newestLocations.map((loc) => (
                 <LocationCard key={`new-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
             )) : featuredLocations.slice(0, 4).reverse().map((loc) => (
                 <LocationCard key={`new-fb-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
             ))}
          </div>
        </section>

        {/* Section: Travel Blogs & News */}
        <section className="mb-24 mt-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 lg:p-12 rounded-3xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                 Cẩm nang Du lịch & Tin tức
              </h2>
              <p className="text-slate-500 font-medium">Cập nhật xu hướng, mẹo vặt và những câu chuyện truyền cảm hứng.</p>
            </div>
            <a href="/blog" className="hidden md:flex text-slate-700 bg-slate-100 px-6 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors text-sm items-center gap-2">
              Đọc thêm <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {blogs.length > 0 ? blogs.map((blog) => (
                 <div key={blog.post_id} className="group cursor-pointer">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 border border-slate-100">
                        <img src={blog.thumbnail_url || 'https://images.unsplash.com/photo-1504280654490-255d28bba1e9'} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                        <span>{new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span className="text-primary-600">{blog.category_name || 'BÀI VIẾT'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2 mb-2 leading-tight">
                        {blog.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">
                        {blog.content_summary || 'Hãy khám phá chi tiết bài viết này để có những bí kíp tuyệt vời nhất cho chuyến đi của bạn.'}
                    </p>
                 </div>
             )) : (
                [1,2,3].map(i => (
                 <div key={i} className="group flex flex-col">
                    <div className="aspect-[4/3] rounded-2xl bg-slate-200 animate-pulse mb-4" />
                    <div className="w-1/3 h-4 bg-slate-200 rounded" />
                    <div className="w-3/4 h-6 bg-slate-200 mt-2 mb-2 rounded" />
                    <div className="w-full h-4 bg-slate-200 rounded" />
                 </div>
                ))
             )}
          </div>
          <div className="mt-8 text-center md:hidden">
              <a href="/blog" className="inline-flex text-primary-600 font-bold hover:underline gap-1 items-center">
                  Xem tất cả cẩm nang <ArrowRight className="w-4 h-4" />
              </a>
          </div>
        </section>
      </div>

      {showOnboarding && user && (
          <OnboardingModal user={user} onClose={handleCloseOnboarding} />
      )}
    </div>
  );
}
