import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import { useAuthStore } from '../store/useAuthStore';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { 
    Heart, 
    LogIn, 
    Loader2, 
    Compass,
    BadgeAlert
} from 'lucide-react';

export default function Recommend() {
  const { coords } = useGeoLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { favorites, loading, fetchFavorites } = useFavoriteStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      fetchFavorites(user.user_id);
    }
  }, [isAuthenticated, user, fetchFavorites]);

  // Map favorites list to Location array
  const favoriteLocations = favorites
    .map((fav) => fav.location)
    .filter((loc) => !!loc);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 font-sans">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] shadow-xl border border-slate-200/60 dark:border-slate-800 text-center max-w-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Heart className="w-10 h-10 text-orange-500 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-slate-850 dark:text-white mb-4">Danh sách Yêu thích của bạn</h2>
              <p className="text-sm text-slate-450 dark:text-slate-400 mb-8 font-semibold leading-relaxed max-w-lg mx-auto">
                Đăng nhập ngay để lưu lại các địa điểm du lịch, ẩm thực yêu thích và đồng bộ hành trình cá nhân trên mọi thiết bị.
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                  <button onClick={() => navigate('/login')} className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">
                      <LogIn className="w-4 h-4" /> Đăng nhập ngay
                  </button>
                  <button onClick={() => navigate('/register')} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200/60 dark:hover:bg-slate-700 active:scale-95 transition-all">
                      Tạo tài khoản mới
                  </button>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Premium Hero Banner */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 h-[220px] flex items-center p-8 md:p-12 shadow-xl">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-50"
            alt="Scenic lake background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/70 to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-wider mb-4">
            <Heart className="w-3 h-3 text-orange-500 fill-orange-500" /> Điểm đến của tôi
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
            Địa điểm <span className="text-orange-500">Yêu thích.</span>
          </h1>
          <p className="text-sm text-slate-300 font-semibold max-w-xl">
            Lưu giữ và theo dõi danh sách các danh lam, quán ăn, khách sạn bạn đã yêu thích trên bản đồ hành trình cá nhân.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold text-sm">Đang tải danh sách yêu thích...</p>
        </div>
      ) : favoriteLocations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Map of favorited locations (5 Columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Bản đồ hành trình yêu thích</h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">{favoriteLocations.length} địa điểm</span>
              </div>
              <div className="h-[450px] w-full rounded-3xl overflow-hidden relative z-0">
                <MapView locations={favoriteLocations} />
              </div>
            </div>
          </div>

          {/* Right Side: Grid of Location Cards (7 Columns) */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {favoriteLocations.map((location) => (
                <LocationCard 
                  key={location.location_id}
                  location={location} 
                  userLat={coords?.lat}
                  userLng={coords?.lng}
                  className="w-full h-full"
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BadgeAlert className="w-6 h-6 text-orange-500" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Danh sách yêu thích trống</h3>
          <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mx-auto mt-2 font-semibold leading-relaxed">
            Bạn chưa lưu địa điểm nào vào danh sách yêu thích. Hãy duyệt qua các địa điểm du lịch tuyệt đẹp để tạo bộ sưu tập của riêng mình!
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="mt-6 px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-orange-650 transition duration-300"
          >
            Đến trang Khám phá ngay
          </button>
        </div>
      )}
    </div>
  );
}