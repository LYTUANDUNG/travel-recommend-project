import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRecommendations } from '../hooks/useRecommendations';
import { api } from '../api';
import { Search, Map, MapPin, Compass, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
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
      <div className="relative w-full h-[650px] lg:h-[850px] overflow-hidden">
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
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#FFFEFA] dark:from-slate-950 via-[#FFFEFA]/50 dark:via-slate-950/50 to-transparent" />
                <div className="absolute inset-0 bg-black/10" />

                <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-20">
                    <div className="max-w-4xl animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="flex justify-center mb-10">
                            <span className="px-6 py-2 bg-white/20 backdrop-blur-3xl border border-white/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Khám phá hành trình mới
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-9xl font-serif font-black text-slate-900 dark:text-white leading-[0.85] mb-10 tracking-tighter filter drop-shadow-2xl">
                          {b.title}
                        </h1>
                        <p className="text-slate-600 dark:text-white/70 text-lg md:text-2xl font-serif italic mb-14 max-w-2xl mx-auto leading-relaxed">
                          Lên kế hoạch dễ dàng, trải nghiệm trọn vẹn tại hàng ngàn điểm đến khắp Việt Nam.
                        </p>
                        
                        {/* Premium Search Bar */}
                        <div className="relative group max-w-2xl mx-auto">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-amber-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-100 dark:border-slate-800">
                                <div className="pl-6 pr-4 border-r border-slate-100 dark:border-slate-800">
                                    <MapPin className="w-5 h-5 text-primary-500" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tìm kho báu thiên nhiên..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && navigate(`/explore?q=${searchQuery}`)}
                                    className="flex-1 px-4 py-3 bg-transparent text-slate-800 dark:text-white outline-none text-base font-bold placeholder:text-slate-400 font-sans"
                                />
                                <button 
                                    onClick={() => navigate(`/explore?q=${searchQuery}`)}
                                    className="px-10 py-4 bg-slate-900 dark:bg-primary-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-95 transition-all shadow-xl flex items-center gap-2"
                                >
                                    <Search className="w-4 h-4" /> Khám phá
                                </button>
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
                </div>
            </div>
        ))}
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-30">
        {/* Categories Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap md:flex-nowrap gap-4 items-center justify-between xl:mx-16 mb-16">
            <div className="flex gap-4 w-full overflow-x-auto custom-scrollbar md:justify-center">
                {(activeCategories.length > 0 ? activeCategories : [
                  { name: 'Khách sạn', id: 1 },
                  { name: 'Nhà hàng', id: 2 },
                  { name: 'Cà phê', id: 3 },
                  { name: 'Văn hóa', id: 4 },
                ]).map(cat => (
                    <a href={`/explore?category=${cat.name}`} key={cat.name} className="flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors group border border-transparent hover:border-slate-200">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                             <Compass className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{cat.name}</span>
                    </a>
                ))}
            </div>
        </div>

        {/* Personalized Journey (Collaborative AI) */}
        {isAuthenticated && recommendations.length > 0 && (
            <section className="mb-20">
               <div className="mb-8 flex justify-between items-end">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        Gợi ý dành riêng cho {user?.full_name}
                      </h2>
                      <p className="text-slate-500 font-medium">Bí mật dựa trên sở thích của bạn do trí tuệ nhân tạo chọn lọc.</p>
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
                 <Sparkles className="w-6 h-6 text-amber-500" /> Vừa mới đăng tải
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
