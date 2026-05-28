import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRecommendations } from '../hooks/useRecommendations';
import { api } from '../api';
import { 
    Search, 
    MapPin, 
    Compass, 
    TrendingUp, 
    ArrowRight, 
    Coffee, 
    Bed, 
    Home as HomeIcon, 
    Utensils, 
    Heart, 
    Users, 
    Laptop, 
    Camera, 
    Eye, 
    VolumeX, 
    Star, 
    Bookmark,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    Map
} from 'lucide-react';
import OnboardingModal from '../components/OnboardingModal';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useFavoriteStore } from '../store/useFavoriteStore';

interface CategoryTemplate {
    name: string;
    icon: any;
    color: string;
    bgColor: string;
    fallbackCount?: number;
}

export default function Home() {
  const { coords } = useGeoLocation();
  const { locations, setLocations, setLoading, loading } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();
  const { recommendations, loading: recLoading } = useRecommendations();
  
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Page states for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 12;

  // New States
  const [newestLocations, setNewestLocations] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [allLocationsForStats, setAllLocationsForStats] = useState<any[]>([]);
  const [totalLocations, setTotalLocations] = useState(0);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Tất cả');

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Category template with beautiful colors and matching VinaTravel icons
  const categoryTemplates: CategoryTemplate[] = [
    { name: 'Quán cà phê', icon: Coffee, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30', fallbackCount: 505 },
    { name: 'Khách sạn', icon: Bed, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30', fallbackCount: 42 },
    { name: 'Homestay', icon: HomeIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', fallbackCount: 18 },
    { name: 'Ăn uống', icon: Utensils, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', fallbackCount: 144 },
    { name: 'Hẹn hò', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30', fallbackCount: 88 },
    { name: 'Tụ tập', icon: Users, color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30', fallbackCount: 40 },
    { name: 'Làm việc', icon: Laptop, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950/30', fallbackCount: 35 },
    { name: 'Sống ảo', icon: Camera, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30', fallbackCount: 197 },
    { name: 'View đẹp', icon: Eye, color: 'text-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-950/30', fallbackCount: 38 },
    { name: 'Yên tĩnh', icon: VolumeX, color: 'text-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-950/30', fallbackCount: 28 },
  ];

  useEffect(() => {
    setLoading(true);
    
    // Fetch Active Categories
    api.category.getActive().then(res => {
        if (res.success) {
            setActiveCategories(res.data);
        }
    });

    // Initial paginated load
    api.location.getPaginated({ page: 0, size: pageSize }).then(res => {
        if (res.success && res.data) {
            setLocations(res.data.content);
            setTotalLocations(res.data.total_elements || res.data.totalElements || res.data.total || res.data.content.length);
            setHasMore(res.data.content.length === pageSize);
        }
    }).finally(() => setLoading(false));

    api.location.getAll().then(res => {
        if (res.success && Array.isArray(res.data)) {
            setAllLocationsForStats(res.data);
            setTotalLocations(prev => prev || res.data.length);
        }
    });

    // Fetch Newest Locations
    api.location.getPaginated({ page: 0, size: 4, sort: 'locationId,desc' }).then(res => {
        if (res.success && res.data) {
            setNewestLocations(res.data.content);
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
                { id: 'dev1', title: 'Khám phá thế giới cùng VinaTravel', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', link: '/explore' },
                { id: 'dev2', title: 'Lập lịch trình đi chơi hoàn hảo với AI', image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', link: '/ai-recommend' }
            ]);
        }
    }).catch(() => {
        setBanners([
            { id: 'dev1', title: 'Khám phá thế giới cùng VinaTravel', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', link: '/explore' }
        ]);
    });
  }, []);

  // Load More Locations (Paginated to prevent BE overload)
  const loadMoreLocations = () => {
    if (loading) return;
    const nextPage = currentPage + 1;
    setLoading(true);
    api.location.getPaginated({ page: nextPage, size: pageSize }).then(res => {
        if (res.success && res.data && res.data.content) {
            const newContent = res.data.content;
            setLocations([...locations, ...newContent]);
            setCurrentPage(nextPage);
            setHasMore(newContent.length === pageSize);
        } else {
            setHasMore(false);
        }
    }).finally(() => setLoading(false));
  };

  // Banner Auto-Slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const { fetchFavorites } = useFavoriteStore();

  // Check For New Users (Cold Start AI)
  useEffect(() => {
      if (isAuthenticated && user) {
          fetchFavorites(user.user_id);
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

  // Dynamic count calculator
  const getLocCount = (catName: string) => {
      const source = allLocationsForStats.length > 0 ? allLocationsForStats : locations;
      return source.filter(loc => 
          loc.category_name?.toLowerCase().includes(catName.toLowerCase()) ||
          loc.category?.name?.toLowerCase().includes(catName.toLowerCase())
      ).length;
  };

  const getCategoryTemplate = (catName: string) => {
      return categoryTemplates.find(t => 
          catName.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(catName.toLowerCase())
      ) || categoryTemplates[0];
  };

  const displayedCategories = activeCategories.length > 0
      ? activeCategories.map((cat: any) => cat.name).filter(Boolean)
      : categoryTemplates.map(cat => cat.name);

  const scrollCategory = (direction: 'left' | 'right') => {
      if (categoryScrollRef.current) {
          const scrollAmount = direction === 'left' ? -250 : 250;
          categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
  };

  const filteredLocations = selectedCategoryName === 'Tất cả'
      ? locations
      : locations.filter(loc => 
          loc.category_name?.toLowerCase().includes(selectedCategoryName.toLowerCase()) ||
          loc.category?.name?.toLowerCase().includes(selectedCategoryName.toLowerCase())
      );

  return (
    <div className="flex flex-col gap-12 pb-20 animate-in fade-in duration-700">
      
      {/* ==================================================== */}
      {/* SECTION 1: MASTER BENTO HERO & MAP GIS INTEGRATION   */}
      {/* ==================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Slider (Spans 8 columns) */}
          {/* Main Hero Slider (Spans 8 columns) */}
          <div 
            onClick={() => {
                const current = banners[currentBanner];
                if (current && current.link) {
                    const trimmed = current.link.trim();
                    if (trimmed) {
                        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
                            window.open(trimmed, '_blank', 'noopener,noreferrer');
                        } else if (trimmed.startsWith('www.')) {
                            window.open(`https://${trimmed}`, '_blank', 'noopener,noreferrer');
                        } else {
                            const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                            navigate(path);
                        }
                    }
                }
            }}
            className={`lg:col-span-8 relative h-[360px] lg:h-[420px] rounded-[2rem] overflow-hidden shadow-sm group border border-slate-200/70 dark:border-slate-800 ${banners[currentBanner]?.link?.trim() ? 'cursor-pointer hover:brightness-[0.98] transition-all duration-300' : ''}`}
          >
            {banners.map((b, idx) => (
                <div 
                    key={b.id || idx} 
                    className={`absolute inset-0 transition-all duration-1000 ${idx === currentBanner ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                    <img 
                      src={b.image_url || b.imageUrl} 
                      alt={b.title} 
                      className="w-full h-full object-cover scale-100 group-hover:scale-[1.01] transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
                </div>
            ))}

            <div className="absolute bottom-8 left-8 right-8 z-20 pointer-events-none flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white px-3 py-1 rounded-full shadow-lg shadow-orange-500/20">
                    {banners[currentBanner]?.id === 'dev1' || banners[currentBanner]?.id === 'dev2'
                        ? "Ứng dụng Du Lịch Đồ Án v3.5"
                        : "Quảng cáo tài trợ"}
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-white mt-4 mb-2 leading-tight tracking-tight drop-shadow-md whitespace-pre-line">
                    {banners[currentBanner]?.title || "Khám phá.\nTrải nghiệm cùng VinaTravel."}
                </h1>
                <p className="text-white/85 text-xs lg:text-sm font-semibold max-w-2xl mt-2 drop-shadow">
                    {banners[currentBanner]?.id === 'dev1'
                        ? "Lập kế hoạch thông minh cho chuyến đi hoàn hảo của bạn với các gợi ý cá nhân hóa theo sở thích thực tế."
                        : banners[currentBanner]?.id === 'dev2'
                        ? "Hỏi trợ lý AI thông minh để tìm những địa điểm lưu trú, quán cafe có view sống ảo chụp hình cực chất."
                        : banners[currentBanner]?.link
                        ? "Chương trình tài trợ quảng cáo hấp dẫn. Click để khám phá ngay ưu đãi đặc biệt!"
                        : "Khám phá địa điểm du lịch, khách sạn và ẩm thực đặc sắc ba miền."}
                </p>

                {banners[currentBanner]?.link?.trim() && (
                    <div className="pointer-events-auto mt-4">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const trimmed = banners[currentBanner].link.trim();
                                if (trimmed) {
                                    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
                                        window.open(trimmed, '_blank', 'noopener,noreferrer');
                                    } else if (trimmed.startsWith('www.')) {
                                        window.open(`https://${trimmed}`, '_blank', 'noopener,noreferrer');
                                    } else {
                                        const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                                        navigate(path);
                                    }
                                }
                            }}
                            className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-extrabold text-xs hover:scale-105 active:scale-95 hover:bg-orange-500 hover:text-white transition-all flex items-center gap-1.5 shadow-lg shadow-black/15 cursor-pointer border border-transparent"
                        >
                            Khám phá ngay <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Glassmorphic inline search on desktop */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-6 left-6 right-6 z-30 bg-white/15 backdrop-blur-md border border-white/25 p-1.5 rounded-2xl flex items-center shadow-lg hidden md:flex"
            >
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 ml-1 shadow-md shadow-orange-500/10">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    placeholder="Tìm kiếm quán cafe đẹp, homestay xinh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && navigate(`/explore?q=${searchQuery}`)}
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/60 font-semibold px-4 text-xs"
                />
                <button 
                    onClick={() => navigate(`/explore?q=${searchQuery}`)} 
                    className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all mr-1 shadow-sm"
                >
                    Đi thôi!
                </button>
            </div>
          </div>

          {/* Right Side Map Bento Column (Spans 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Dynamic Map GIS Card */}
              <div 
                onClick={() => navigate('/map')}
                className="flex-1 min-h-[220px] rounded-[2rem] bg-slate-900 p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all border border-slate-800"
              >
                  {/* Map Layer Background */}
                  <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                      <MapView 
                          locations={locations.slice(0, 3)} 
                          center={coords ? [coords.lat, coords.lng] : undefined} 
                          zoom={12} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10 pointer-events-none" />
                  </div>

                  <div className="relative z-20">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/20">
                          <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-black leading-tight tracking-tight drop-shadow-sm">Bản đồ GIS</h3>
                      <p className="text-white/80 font-medium text-[11px] mt-1 max-w-[180px]">Định vị thông minh hàng ngàn địa điểm giải trí quanh bạn.</p>
                  </div>
                  <div className="relative z-20 flex justify-end mt-4">
                      <button className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.35)] transition-all shadow-md">
                          <ArrowRight className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 2: CATEGORY HORIZONTAL SLIDER (VinaTravel theme) */}
      {/* ==================================================== */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                      Khám phá theo nhu cầu
                  </h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">Lựa chọn của bạn là gì?</p>
              </div>
              
              {/* Scroll controls */}
              <div className="flex gap-2">
                  <button 
                      onClick={() => scrollCategory('left')}
                      className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-500 dark:text-slate-400"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                      onClick={() => scrollCategory('right')}
                      className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-500 dark:text-slate-400"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          </div>

          {/* Horizontal Scrolling Row */}
          <div 
              ref={categoryScrollRef}
              className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2"
          >
              {/* Category: All */}
              <button 
                  onClick={() => setSelectedCategoryName('Tất cả')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[100px] border transition-all duration-300
                      ${selectedCategoryName === 'Tất cả'
                          ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-400 shadow-md shadow-orange-500/5'
                          : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800/80 hover:scale-105'
                      }`}
              >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-50 dark:bg-slate-800`}>
                      <Compass className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-[11px] font-black tracking-tight truncate w-full text-center">Tất cả</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">{totalLocations || locations.length} điểm</span>
              </button>

              {displayedCategories.map((catName) => {
                  const cat = getCategoryTemplate(catName);
                  const Icon = cat.icon;
                  const count = getLocCount(catName);
                  const isSelected = selectedCategoryName === catName;

                  return (
                      <button
                          key={catName}
                          onClick={() => {
                              setSelectedCategoryName(catName);
                              navigate(`/explore?category=${catName}`);
                          }}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[100px] border transition-all duration-300
                              ${isSelected
                                  ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-400 shadow-md shadow-orange-500/5'
                                  : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800/80 hover:scale-105'
                              }`}
                      >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${cat.bgColor}`}>
                              <Icon className={`w-5 h-5 ${cat.color}`} />
                          </div>
                          <span className="text-[11px] font-black tracking-tight truncate w-full text-center">{catName}</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1">{count} điểm</span>
                      </button>
                  );
              })}
          </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 3: PERSONALIZED RECOMMENDATIONS (AI ENGINE) */}
      {/* ==================================================== */}
      {isAuthenticated && recommendations.length > 0 && (
          <section className="bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent p-6 rounded-3xl border border-blue-500/10 shadow-[0_4px_25px_rgba(37,99,235,0.02)]">
             <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-blue-500 shrink-0 animate-bounce" /> Gợi ý dành riêng cho {user?.full_name?.split(' ').pop()}
                    </h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">Gợi ý dựa trên sở thích, đánh giá và địa điểm bạn đã quan tâm.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.slice(0, 4).map((loc: any) => (
                    <LocationCard key={`rec-${loc.location_id || loc.id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
                ))}
            </div>
          </section>
      )}

      {/* ==================================================== */}
      {/* SECTION 4: CAFE RECOMMENDATIONS (SCREENSHOT REPLICATED) */}
      {/* ==================================================== */}
      <section>
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                      Gợi ý Cà phê tại <span className="text-orange-500">Thành phố Hồ Chí Minh</span>
                  </h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">Các quán cà phê được check-in nhiều nhất trên VinaTravel.</p>
              </div>
              <button 
                  onClick={() => navigate('/explore?category=Quán cà phê')}
                  className="text-orange-500 hover:text-orange-600 font-extrabold text-xs flex items-center gap-1.5 group"
              >
                  Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locations.filter(loc => 
                  loc.category_name?.toLowerCase().includes('cà phê') ||
                  loc.category?.name?.toLowerCase().includes('cà phê')
              ).slice(0, 4).map((loc) => (
                  <LocationCard key={`cafe-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
              ))}
              {/* Fallback if no specific cafe locations, just use featured ones */}
              {locations.filter(loc => 
                  loc.category_name?.toLowerCase().includes('cà phê') ||
                  loc.category?.name?.toLowerCase().includes('cà phê')
              ).length === 0 && locations.slice(0, 4).map((loc) => (
                  <LocationCard key={`cafe-fb-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
              ))}
          </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 5: GEOGRAPHIC/GIS NEARBY RECOMMENDATIONS     */}
      {/* ==================================================== */}
      {coords && locations.length > 0 && (
          <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
             <div className="mb-6">
                <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500 shrink-0" /> Quanh đây có gì vui?
                </h2>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">Đề xuất các địa điểm cách bạn chỉ vài trăm mét.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...locations]
                    .filter(loc => loc.latitude && loc.longitude)
                    .sort((a, b) => {
                        const distA = Math.pow(a.latitude - coords.lat, 2) + Math.pow(a.longitude - coords.lng, 2);
                        const distB = Math.pow(b.latitude - coords.lat, 2) + Math.pow(b.longitude - coords.lng, 2);
                        return distA - distB;
                    })
                    .slice(0, 4)
                    .map((loc: any) => (
                    <LocationCard key={`nearby-${loc.location_id}`} location={loc} userLat={coords.lat} userLng={coords.lng} />
                ))}
            </div>
          </section>
      )}

      {/* ==================================================== */}
      {/* SECTION 6: KHO ĐỊA ĐIỂM TỔNG HỢP (PAGINATED CHUNKS) */}
      {/* ==================================================== */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
               Kho địa điểm ăn chơi tổng hợp
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">
               {selectedCategoryName === 'Tất cả' ? 'Toàn bộ kho dữ liệu thực tế' : `Lọc theo danh mục: ${selectedCategoryName}`}
            </p>
          </div>
        </div>

        {loading && filteredLocations.length === 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
             ))}
           </div>
        ) : (
           <div className="flex flex-col gap-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {filteredLocations.map((loc) => (
                 <LocationCard key={`loc-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
               ))}
             </div>

             {/* Paginated Load More Button to prevent Spring Boot overload */}
             {hasMore && selectedCategoryName === 'Tất cả' && (
                 <div className="flex justify-center mt-4">
                     <button 
                         onClick={loadMoreLocations}
                         disabled={loading}
                         className="px-8 py-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-2"
                     >
                         {loading ? 'Đang kết nối BE...' : 'Xem thêm địa điểm'}
                         <ChevronRight className="w-4 h-4" />
                     </button>
                 </div>
             )}
           </div>
        )}
      </section>

      {/* ==================================================== */}
      {/* SECTION 7: TRAVEL BLOGS & USER GUIDE (CẨM NANG)    */}
      {/* ==================================================== */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-8 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
               Cẩm nang Du lịch & Tin tức
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">Cập nhật xu hướng du lịch khám phá hàng đầu.</p>
          </div>
          <button 
              onClick={() => navigate('/blog')}
              className="text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 px-5 py-2.5 rounded-xl font-black text-xs items-center gap-1.5 flex transition-all"
          >
            Đọc thêm <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {blogs.length > 0 ? blogs.map((blog) => (
               <div 
                   key={blog.post_id} 
                   onClick={() => navigate(`/blog/${blog.post_id}`)}
                   className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800/80 flex flex-col h-full"
               >
                  <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={blog.thumbnail_url || 'https://images.unsplash.com/photo-1504280654490-255d28bba1e9?auto=format&fit=crop&w=400&q=80'} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                      <div className="flex gap-2 text-[9px] font-black text-slate-400 mb-2.5 uppercase tracking-widest">
                          <span>{new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span className="text-blue-500">{blog.category_name || 'BÀI VIẾT'}</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-950 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-2 mb-2.5 leading-snug">
                          {blog.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-auto">
                          {blog.content_summary || 'Xem cẩm nang chi tiết tại VinaTravel để có thêm kinh nghiệm hữu ích cho hành trình.'}
                      </p>
                  </div>
               </div>
           )) : (
              [1,2,3].map(i => (
                <div key={i} className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                   <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                   <div className="p-5">
                       <div className="w-1/3 h-3 bg-slate-100 dark:bg-slate-800 rounded mb-2 animate-pulse" />
                       <div className="w-3/4 h-5 bg-slate-100 dark:bg-slate-800 mb-2 rounded animate-pulse" />
                       <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                   </div>
                </div>
              ))
           )}
        </div>
      </section>

      {showOnboarding && user && (
          <OnboardingModal user={user} onClose={handleCloseOnboarding} />
      )}
    </div>
  );
}
