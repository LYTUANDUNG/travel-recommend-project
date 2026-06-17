import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Check, Clock, DollarSign, Heart, MapPin, Navigation, PlusCircle, Share2, Sparkles, Star } from 'lucide-react';
import { Location as TravelLocation } from '../types/schema';
import BookingModal from '../components/BookingModal';
import LocationCard from '../components/LocationCard';
import MapView from '../components/MapView';
import ReviewSection from '../components/ReviewSection';
import { PageContainer, PageHeader, PageLoader, PageShell, Surface, primaryButtonClassName, secondaryButtonClassName } from '../components/ui/AppPage';
import { api } from '../api';
import { externalApi } from '../api/external';
import { useAuthStore } from '../store/useAuthStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useLocationStore } from '../store/useLocationStore';
import { useTripStore } from '../store/useTripStore';
import { cn } from '../utils/cn';
import { formatOneDecimalFloor, humanizeDistance } from '../utils/humanize';
import { decodeId } from '../utils/obfuscate';

function getOpeningStatus(openingHour?: string, closingHour?: string): { status: string; isOpen: boolean } {
  if (!openingHour || !closingHour) {
    return { status: 'Chưa cập nhật', isOpen: false };
  }

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const openMinutes = parseTime(openingHour);
  const closeMinutes = parseTime(closingHour);

  if (closeMinutes > openMinutes) {
    const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    return {
      status: isOpen ? 'Đang mở cửa' : 'Đóng cửa',
      isOpen
    };
  } else {
    const isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    return {
      status: isOpen ? 'Đang mở cửa' : 'Đóng cửa',
      isOpen
    };
  }
}

export default function LocationDetail() {
  const { id: rawId } = useParams();
  const id = useMemo(() => decodeId(rawId), [rawId]);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { coords } = useGeoLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { locations, setSelected } = useLocationStore();
  const { addItem } = useTripStore();

  const [location, setLocation] = useState<TravelLocation | null>(null);
  const [similarPlaces, setSimilarPlaces] = useState<TravelLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [visitStatus, setVisitStatus] = useState<string | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [directionLoading, setDirectionLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLocation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setRoute(null);
    setRouteError(null);
    api.location.getById(id)
      .then(res => {
        if (res.success && res.data) {
          setLocation(res.data);
          setSelected(res.data);
        } else {
          setLocation(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id, setSelected]);

  useEffect(() => {
    if (!id) return;
    api.location.getSimilar(id, 4).then(res => {
      if (res.success && Array.isArray(res.data)) setSimilarPlaces(res.data);
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setIsFavorited(false);
      setVisitStatus(null);
      return;
    }

    api.favorite.getByUser(user.user_id).then(res => {
      if (res.success && Array.isArray(res.data)) {
        setIsFavorited(res.data.some((fav: any) => fav.location?.location_id === id || fav.location?.locationId === id));
      }
    });

    api.visit.getUserRequests(user.user_id).then(res => {
      if (res.success && Array.isArray(res.data)) {
        const current = res.data.find((visit: any) => visit.location?.location_id === id || visit.location_id === id);
        setVisitStatus(current?.status || null);
      }
    });
  }, [id, user]);

  useEffect(() => {
    if (isAuthenticated && user && id) {
      api.behavior.logAction({
        user_id: user.user_id,
        location_id: id,
        action: 'VIEW_DETAILS'
      }).catch(() => {});
    }
  }, [id, isAuthenticated, user]);

  const similarLocations = useMemo(() => {
    if (!location) return [];
    if (similarPlaces.length > 0) return similarPlaces;
    return locations
      .filter(item => item.location_id !== location.location_id && item.category_id === location.category_id)
      .slice(0, 4);
  }, [location, locations, similarPlaces]);

  const openingStatus = useMemo(() => {
    if (!location) return { status: 'Chưa cập nhật', isOpen: false };
    return getOpeningStatus(location.opening_hour, location.closing_hour);
  }, [location]);

  if (loading) return <PageLoader label="Đang tải địa điểm..." />;

  if (!location) {
    return (
      <PageShell>
        <PageContainer className="pt-10">
          <Surface className="p-10 text-center">
            <h1 className="text-2xl font-black">Không tìm thấy địa điểm</h1>
            <button className={cn(primaryButtonClassName, "mt-6")} onClick={() => navigate('/explore')}>
              Quay lại khám phá
            </button>
          </Surface>
        </PageContainer>
      </PageShell>
    );
  }

  const heroImage = location.thumbnail_url || location.images?.[0] || 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80';
  const score = routerLocation.state?.matchScore ?? location.match_score;
  const normalizedScore = score == null ? undefined : score > 1 ? score / 100 : score;

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      alert('Vui lòng đăng nhập để lưu địa điểm.');
      return;
    }
    const res = await api.favorite.toggle(user.user_id, location.location_id);
    if (res.success) {
      setIsFavorited(res.data);
      if (res.data) {
        api.behavior.logAction({
          user_id: user.user_id,
          location_id: location.location_id,
          action: 'ADD_FAVORITE'
        }).catch(() => {});
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: location.name, text: location.description, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 1800);
      }
    } catch {
      setIsShared(false);
    }
  };

  const handleAddToTrip = () => {
    addItem(location);
    navigate('/planner');
  };

  const handleGetDirections = async () => {
    if (!coords) {
      setRouteError('Vui lòng bật định vị để xem đường đi.');
      return;
    }

    setDirectionLoading(true);
    setRouteError(null);
    try {
      const routeData = await externalApi.getDirections(coords.lat, coords.lng, location.latitude, location.longitude);
      if (routeData) {
        setRoute(routeData);
        if (isAuthenticated && user) {
          api.behavior.logAction({
            user_id: user.user_id,
            location_id: location.location_id,
            action: 'VIEW_MAP'
          }).catch(() => {});
        }
      }
      else setRouteError('Không tìm được tuyến đường phù hợp.');
    } catch {
      setRouteError('Không thể tải chỉ đường lúc này.');
    } finally {
      setDirectionLoading(false);
    }
  };

  return (
    <PageShell>
      <PageContainer className="pt-8 space-y-8">
        <PageHeader
          media={heroImage}
          eyebrow={location.category_name || 'Địa điểm'}
          title={location.name}
          description={location.address || location.province || 'Thông tin địa điểm đang được cập nhật.'}
          className="min-h-[360px] flex items-end"
          actions={
            <>
              <button onClick={handleShare} className={secondaryButtonClassName}>
                {isShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                Chia sẻ
              </button>
              <button onClick={handleToggleFavorite} className={cn(secondaryButtonClassName, isFavorited && "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20")}>
                <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                Yêu thích
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <Surface className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoTile icon={<Star className="w-5 h-5 fill-amber-400 text-amber-400" />} label="Đánh giá" value={formatOneDecimalFloor(location.average_rating)} />
                <InfoTile 
                  icon={<Clock className={cn("w-5 h-5", openingStatus.isOpen ? "text-emerald-500" : "text-slate-400")} />} 
                  label="Trạng thái" 
                  value={
                    <span className={openingStatus.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                      {openingStatus.status}
                    </span>
                  } 
                />
                <InfoTile 
                  icon={<Clock className="w-5 h-5 text-orange-500" />} 
                  label="Giờ mở cửa" 
                  value={
                    location.opening_hour && location.closing_hour
                      ? `${location.opening_hour.slice(0, 5)} - ${location.closing_hour.slice(0, 5)}`
                      : 'Chưa cập nhật'
                  } 
                />
                <InfoTile icon={<MapPin className="w-5 h-5 text-orange-500" />} label="Khoảng cách" value={humanizeDistance(coords?.lat, coords?.lng, location.latitude, location.longitude)} />
              </div>
            </Surface>

            <Surface className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-6 mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Tổng quan</p>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Thông tin địa điểm</h2>
                </div>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {location.total_reviews || 0} nhận xét
                </span>
              </div>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-7">
                {location.description || 'Địa điểm này chưa có mô tả chi tiết.'}
              </p>
            </Surface>

            {location.images && location.images.length > 0 && (
              <Surface className="p-6 md:p-8">
                <div className="mb-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Hình ảnh</p>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Thư viện</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {location.images.slice(0, 6).map((image, index) => (
                    <img key={index} src={image} alt={`${location.name}-${index}`} className="aspect-[4/3] w-full object-cover rounded-2xl border border-slate-100 dark:border-slate-800" />
                  ))}
                </div>
              </Surface>
            )}

            <Surface className="p-3">
              <div className="h-[420px] rounded-2xl overflow-hidden">
                <MapView
                  locations={[location]}
                  center={[location.latitude, location.longitude]}
                  zoom={15}
                  route={route}
                />
              </div>
            </Surface>

            <ReviewSection locationId={location.location_id} compact />
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <Surface className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Hành động</p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">Lên kế hoạch</h3>
              </div>

              <button
                onClick={() => setIsBookingOpen(true)}
                disabled={visitStatus === 'PENDING'}
                className={cn(primaryButtonClassName, "w-full py-4")}
              >
                <Calendar className="w-4 h-4" />
                {visitStatus === 'PENDING' ? 'Đang chờ duyệt' : 'Đăng ký tham quan'}
              </button>

              <button onClick={handleAddToTrip} className={cn(secondaryButtonClassName, "w-full py-4")}>
                <PlusCircle className="w-4 h-4 text-orange-500" />
                Thêm vào lịch trình
              </button>

              <button onClick={handleGetDirections} disabled={directionLoading} className={cn(secondaryButtonClassName, "w-full py-4")}>
                <Navigation className="w-4 h-4 text-orange-500" />
                {directionLoading ? 'Đang tải...' : 'Chỉ đường'}
              </button>

              {routeError && <p className="text-xs font-semibold text-red-500 text-center">{routeError}</p>}
            </Surface>

            <Surface className="p-6 space-y-4">
              <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Chi phí" value={location.price_range_str || 'Cập nhật tại điểm'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Khu vực" value={location.province || 'Chưa rõ'} />
              <InfoRow icon={<Star className="w-4 h-4" />} label="Lượt khám phá" value={`${location.view_count || 0}`} />
            </Surface>
          </aside>
        </div>

        {similarLocations.length > 0 && (
          <section className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Gợi ý thêm</p>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Địa điểm tương tự</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {similarLocations.map(item => <LocationCard key={item.location_id} location={item} userLat={coords?.lat} userLng={coords?.lng} />)}
            </div>
          </section>
        )}
      </PageContainer>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        locationId={location.location_id}
        locationName={location.name}
        onSuccess={() => setVisitStatus('PENDING')}
      />
    </PageShell>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 min-h-28">
      <div className="mb-3">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
