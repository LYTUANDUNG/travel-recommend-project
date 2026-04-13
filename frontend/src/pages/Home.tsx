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

export default function Home() {
  const { locations, setLocations, setLoading, loading } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();
  const { recommendations, loading: recLoading } = useRecommendations();
  
  
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States
  const [newestLocations, setNewestLocations] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    api.location.getPaginated({ page: 0, size: 50 }).then(res => {
        if (res.success && res.data) {
            setLocations(res.data.content);
        }
    }).finally(() => setLoading(false));

    // Fetch Newest Locations
    api.location.getPaginated({ page: 0, size: 4, sort: 'locationId,desc' }).then(res => {
        if (res.success && res.data) {
            // Dùng data trả về, nếu ko có thì giả lập đảo ngược mảng
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
            // Fallback default banners
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
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950">
      {/* 1. Cinematic Hero - Standard Clean */}
      <div className="relative w-full h-[500px] lg:h-[650px] overflow-hidden bg-slate-900">
        {banners.map((b, idx) => (
            <div 
                key={b.id} 
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
                <img src={b.image_url || b.imageUrl} alt={b.title} className="w-full h-full object-cover opacity-60" />
                
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-20">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                          {b.title}
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl font-medium mb-10">
                          Lên kế hoạch dễ dàng, trải nghiệm trọn vẹn tại hàng ngàn điểm đến khắp Việt Nam.
                        </p>
                        
                        <div className="flex bg-white rounded-lg p-2 max-w-2xl mx-auto shadow-lg">
                            <input 
                                type="text" 
                                placeholder="Nhập tên địa điểm bạn muốn đến..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && navigate(`/explore?q=${searchQuery}`)}
                                className="flex-1 px-4 py-3 text-slate-800 outline-none text-base"
                            />
                            <button 
                                onClick={() => navigate(`/explore?q=${searchQuery}`)}
                                className="px-8 py-3 bg-primary-600 text-white rounded-md font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"
                            >
                                <Search className="w-5 h-5" /> Tìm kiếm
                            </button>
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
                {[
                  { name: 'Hà Nội', icon: <Map className="w-5 h-5" /> },
                  { name: 'Đà Nẵng', icon: <Compass className="w-5 h-5" /> },
                  { name: 'Đà Lạt', icon: <MapPin className="w-5 h-5" /> },
                  { name: 'Hồ Chí Minh', icon: <Map className="w-5 h-5" /> },
                ].map(cat => (
                    <a href={`/explore?q=${cat.name}`} key={cat.name} className="flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors group border border-transparent hover:border-slate-200">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                             {cat.icon}
                        </div>
                        <span className="font-bold text-sm tracking-tight">{cat.name}</span>
                    </a>
                ))}
            </div>
        </div>

        {/* Personalized Journey (Guarded for Authenticated Users Only) */}
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
                      <LocationCard key={`rec-${loc.location_id || loc.id}`} location={loc} />
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
                 <LocationCard key={loc.location_id} location={loc} />
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
                 <LocationCard key={`new-${loc.location_id}`} location={loc} />
             )) : featuredLocations.slice(0, 4).reverse().map((loc) => (
                 <LocationCard key={`new-fb-${loc.location_id}`} location={loc} />
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
