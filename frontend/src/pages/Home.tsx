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
    UtensilsCrossed,
    Soup,
    Beer,
    Pizza,
    Cake,
    Church,
    Flower2,
    Bed, 
    Home as HomeIcon, 
    Utensils, 
    Heart, 
    Users, 
    Laptop, 
    Camera, 
    Eye, 
    VolumeX, 
    ChevronLeft,
    ChevronRight,
    BookOpen
} from 'lucide-react';
import OnboardingModal from '../components/OnboardingModal';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

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
  const { recommendations } = useRecommendations();
  
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 12;

  const [blogs, setBlogs] = useState<any[]>([]);
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [totalLocations, setTotalLocations] = useState(0);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Tất cả');

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const categoryTemplates: CategoryTemplate[] = [
    { name: 'Nhà hàng', icon: UtensilsCrossed, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30', fallbackCount: 6 },
    { name: 'Quán ăn', icon: Soup, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', fallbackCount: 16 },
    { name: 'Quán cà phê', icon: Coffee, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30', fallbackCount: 4 },
    { name: 'Quán nhậu / Bar', icon: Beer, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30', fallbackCount: 8 },
    { name: 'Đồ ăn nhanh', icon: Pizza, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', fallbackCount: 9 },
    { name: 'Tiệm bánh', icon: Cake, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30', fallbackCount: 1 },
    { name: 'Nhà thờ', icon: Church, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30', fallbackCount: 1 },
    { name: 'Tịnh thất', icon: Flower2, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', fallbackCount: 1 },
  ];

  useEffect(() => {
    setLoading(true);
    
    Promise.allSettled([
      api.category.getActive(),
      api.location.getPaginated({ page: 0, size: pageSize }),
      api.location.getPaginated({ page: 0, size: 4, sort: 'locationId,desc' }),
      api.blog.getAll(),
      api.client.get('/banners/active')
    ]).then(([activeCategoriesRes, paginatedLocationsRes, newestLocationsRes, blogsRes, bannersRes]) => {
      if (activeCategoriesRes.status === 'fulfilled' && activeCategoriesRes.value.success) {
        setActiveCategories(activeCategoriesRes.value.data);
      }

      if (paginatedLocationsRes.status === 'fulfilled' && paginatedLocationsRes.value.success && paginatedLocationsRes.value.data) {
        const data = paginatedLocationsRes.value.data;
        setLocations(data.content || []);
        setTotalLocations(data.total_elements || data.totalElements || data.total || (data.content || []).length);
        setHasMore((data.content || []).length === pageSize);
      }

      if (blogsRes.status === 'fulfilled' && blogsRes.value.success && blogsRes.value.data) {
        const rawData = blogsRes.value.data as any;
        const blogData = Array.isArray(rawData) ? rawData : (rawData.content || []);
        setBlogs(blogData.slice(0, 3));
      }

      if (bannersRes.status === 'fulfilled') {
        const resData = bannersRes.value.data;
        if (resData?.success && resData.data && resData.data.length > 0) {
          setBanners(resData.data);
        } else {
          setBanners([
            { id: 'dev1', title: 'Khám phá thế giới cùng VinaTravel', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', link: '/explore' },
            { id: 'dev2', title: 'Lập lịch trình đi chơi hoàn hảo với AI', image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', link: '/ai-recommend' }
          ]);
        }
      } else {
        setBanners([
          { id: 'dev1', title: 'Khám phá thế giới cùng VinaTravel', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', link: '/explore' }
        ]);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

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

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const { fetchFavorites } = useFavoriteStore();

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

  const getLocCount = (catName: string) => {
      const activeCat = activeCategories.find((c: any) => 
          c.name?.toLowerCase().includes(catName.toLowerCase()) ||
          catName.toLowerCase().includes(c.name?.toLowerCase())
      );
      if (activeCat) {
          const count = activeCat.location_count !== undefined ? activeCat.location_count : activeCat.locationCount;
          if (count !== undefined && count !== null) {
              return count;
          }
      }
      const template = categoryTemplates.find(t => 
          t.name.toLowerCase().includes(catName.toLowerCase()) ||
          catName.toLowerCase().includes(t.name.toLowerCase())
      );
      return template?.fallbackCount || 0;
  };

  const getCategoryTemplate = (catName: string) => {
      return categoryTemplates.find(t => 
          catName.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(catName.toLowerCase())
      ) || categoryTemplates[0];
  };

  const displayedCategories = categoryTemplates.map(cat => cat.name);

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
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-500">
      
      {/* ==================================================== */}
      {/* HERO SECTION                                         */}
      {/* ==================================================== */}
      <section className="relative h-[480px] rounded-3xl overflow-hidden shadow-premium">
          {banners.map((b, idx) => (
              <div 
                  key={b.id || idx} 
                  className={`absolute inset-0 transition-all duration-1000 ${idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                  <img 
                    src={b.image_url || b.imageUrl} 
                    alt={b.title} 
                    className="w-full h-full object-cover" 
                  />
              </div>
          ))}
          {/* Strict Dark Overlay */}
          <div className="absolute inset-0 bg-black/40 z-10" />

          {/* Centered Content */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center h-full px-6 gap-6 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight font-sans">
                  {banners[currentBanner]?.title || "Khám phá trải nghiệm du lịch tuyệt vời"}
              </h1>
              
              {/* Large, rounded-full search bar */}
              <div className="w-full bg-white dark:bg-slate-900 rounded-full shadow-lg p-1.5 flex items-center gap-2 h-14">
                  <div className="pl-4 text-slate-400">
                      <Search className="w-5 h-5" />
                  </div>
                  <input 
                      type="text" 
                      placeholder="Tìm kiếm địa điểm du lịch, ẩm thực, lưu trú..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/explore?q=${searchQuery}`)}
                      className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 font-medium px-2 text-sm"
                  />
                  <Button 
                      variant="primary"
                      onClick={() => navigate(`/explore?q=${searchQuery}`)}
                      className="rounded-full h-11 px-8 text-sm font-semibold shadow-md shrink-0 mr-1"
                  >
                      Tìm kiếm
                  </Button>
              </div>
          </div>
      </section>

      {/* ==================================================== */}
      {/* CATEGORY SLIDER                                      */}
      {/* ==================================================== */}
      <Card variant="raised" padding="md" className="relative">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight font-sans">
                      Khám phá theo nhu cầu
                  </h2>
              </div>
              
              <div className="flex gap-2">
                  <button 
                      onClick={() => scrollCategory('left')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                      onClick={() => scrollCategory('right')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          </div>

          <div 
              ref={categoryScrollRef}
              className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2"
          >
              <button 
                  onClick={() => setSelectedCategoryName('Tất cả')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[110px] border transition-all duration-300
                      ${selectedCategoryName === 'Tất cả'
                          ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/50 dark:text-primary-400'
                          : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-850 hover:scale-105'
                      }`}
              >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-50 dark:bg-slate-800">
                      <Compass className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-xs font-bold text-center">Tất cả</span>
                  <span className="text-[10px] font-medium text-slate-400 mt-1">{totalLocations || locations.length} điểm</span>
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
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[110px] border transition-all duration-300
                              ${isSelected
                                  ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/50'
                                  : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-850 hover:scale-105'
                              }`}
                      >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${cat.bgColor}`}>
                              <Icon className={`w-5 h-5 ${cat.color}`} />
                          </div>
                          <span className="text-xs font-bold text-center">{catName}</span>
                          <span className="text-[10px] font-medium text-slate-400 mt-1">{count} điểm</span>
                      </button>
                  );
              })}
          </div>
      </Card>

      {/* ==================================================== */}
      {/* PERSONALIZED RECOMMENDATIONS                         */}
      {/* ==================================================== */}
      {isAuthenticated && recommendations.length > 0 && (
          <section className="bg-gradient-to-tr from-primary-500/5 to-transparent p-6 rounded-3xl border border-primary-500/10">
             <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                   <TrendingUp className="w-5 h-5 text-primary-500" /> Gợi ý dành riêng cho bạn
                </h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {recommendations.slice(0, 4).map((loc: any) => (
                     <LocationCard key={`rec-${loc.location_id || loc.id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
                 ))}
             </div>
          </section>
      )}

      {/* ==================================================== */}
      {/* CAFE RECOMMENDATIONS                                 */}
      {/* ==================================================== */}
      <Card variant="raised" padding="md" className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white font-sans">
                  Cà phê tại <span className="text-primary-500">TP. Hồ Chí Minh</span>
              </h2>
              <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/explore?category=Quán cà phê')}
                  className="text-primary-500 font-semibold flex items-center gap-1 group"
              >
                  Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locations.filter(loc => 
                  loc.category_name?.toLowerCase().includes('cà phê') ||
                  loc.category?.name?.toLowerCase().includes('cà phê')
              ).slice(0, 4).map((loc) => (
                  <LocationCard key={`cafe-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
              ))}
              {locations.filter(loc => 
                  loc.category_name?.toLowerCase().includes('cà phê') ||
                  loc.category?.name?.toLowerCase().includes('cà phê')
              ).length === 0 && locations.slice(0, 4).map((loc) => (
                  <LocationCard key={`cafe-fb-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
              ))}
          </div>
      </Card>

      {/* ==================================================== */}
      {/* GIS NEARBY                                           */}
      {/* ==================================================== */}
      {coords && locations.length > 0 && (
          <Card variant="raised" padding="md" className="flex flex-col gap-6">
             <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                  <MapPin className="w-5 h-5 text-red-500" /> Quanh đây có gì vui
                </h2>
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
          </Card>
      )}

      {/* ==================================================== */}
      {/* COMPREHENSIVE LOCATIONS GRID                         */}
      {/* ==================================================== */}
      <Card variant="raised" padding="md" className="flex flex-col gap-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white font-sans">
               Kho địa điểm ăn chơi tổng hợp
            </h2>
        </div>

        {loading && filteredLocations.length === 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-72 bg-slate-150 dark:bg-slate-800 rounded-2xl animate-pulse" />
             ))}
           </div>
        ) : (
           <div className="flex flex-col gap-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {filteredLocations.map((loc) => (
                 <LocationCard key={`loc-${loc.location_id}`} location={loc} userLat={coords?.lat} userLng={coords?.lng} />
               ))}
             </div>

             {hasMore && selectedCategoryName === 'Tất cả' && (
                 <div className="flex justify-center mt-4">
                     <Button 
                         onClick={loadMoreLocations}
                         loading={loading}
                         variant="secondary"
                         className="flex items-center gap-1.5 shadow-sm"
                     >
                         Xem thêm địa điểm <ChevronRight className="w-4 h-4" />
                     </Button>
                 </div>
             )}
           </div>
        )}
      </Card>

      {/* ==================================================== */}
      {/* TRAVEL BLOGS                                         */}
      {/* ==================================================== */}
      <Card variant="raised" padding="lg" className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white font-sans">
               Cẩm nang Du lịch & Tin tức
            </h2>
          <Button 
              onClick={() => navigate('/blog')}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
          >
            Đọc thêm <BookOpen className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {blogs.length > 0 ? blogs.map((blog) => (
               <div 
                   key={blog.post_id} 
                   onClick={() => navigate(`/blog/${blog.post_id}`)}
                   className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-150 dark:border-slate-800 flex flex-col h-full"
               >
                  <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={blog.thumbnail_url || 'https://images.unsplash.com/photo-1504280654490-255d28bba1e9?auto=format&fit=crop&w=400&q=80'} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                      <div className="flex gap-2 text-[9px] font-black text-slate-450 mb-2.5 uppercase tracking-widest">
                          <span>{new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span className="text-primary-500">{blog.category_name || 'BÀI VIẾT'}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-2 mb-2.5 leading-snug font-sans">
                          {blog.title}
                      </h3>
                      <p className="text-[11px] text-slate-450 line-clamp-2 mt-auto">
                          {blog.content_summary || 'Xem cẩm nang chi tiết tại VinaTravel để có thêm kinh nghiệm hữu ích cho hành trình.'}
                      </p>
                  </div>
               </div>
           )) : (
              [1,2,3].map(i => (
                 <div key={i} className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 animate-pulse">
                    <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800" />
                    <div className="p-5">
                        <div className="w-1/3 h-3 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                        <div className="w-3/4 h-5 bg-slate-100 dark:bg-slate-800 mb-2 rounded" />
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                 </div>
              ))
           )}
        </div>
      </Card>

      {showOnboarding && user && (
          <OnboardingModal user={user} onClose={handleCloseOnboarding} />
      )}
    </div>
  );
}
