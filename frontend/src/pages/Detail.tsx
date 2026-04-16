import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Location as TravelLocation } from '../types/schema';
import MapView from '../components/MapView';
import RatingStars from '../components/RatingStars';
import ReviewSection from '../components/ReviewSection';
import LocationList from '../components/LocationList';
import BookingModal from '../components/BookingModal';
import { useLocationStore } from '../store/useLocationStore';
import { useTripStore } from '../store/useTripStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { api } from '../api';
import { externalApi } from '../api/external';
import LocationCard from '../components/LocationCard';
import { MapPin, Clock, DollarSign, Calendar, Heart, Share2, Check, Sparkles, PlusCircle, Star, Info } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { humanizeDistance } from '../utils/humanize';
import { cn } from '../utils/cn';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSelected, locations } = useLocationStore();
  const { calculateDistance, coords } = useGeoLocation();
  const { user, isAuthenticated } = useAuthStore();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [similarPlaces, setSimilarPlaces] = useState<TravelLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Routing State
  const [route, setRoute] = useState<any>(null);
  const [directionLoading, setDirectionLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const routerLocation = useLocation();
  const [visitStatus, setVisitStatus] = useState<string | null>(null);

  useEffect(() => {
    // Reset route when location changes
    setRoute(null);
    setRouteError(null);

    if (id && !isNaN(+id)) {
      setLoading(true);
      api.location.getById(+id)
        .then(res => {
          if (res.success && res.data) {
            setSelectedLocation(res.data);
            setSelected(res.data);
            
            // Check if favorited
            if (user) {
              api.favorite.getByUser(user.user_id).then(favRes => {
                if (favRes.success && Array.isArray(favRes.data)) {
                  const isFav = favRes.data.some((f: any) => f.location && f.location.location_id === +id);
                  setIsFavorited(isFav);
                }
              }).catch(err => console.error("Fav check error", err));

              // Check visit status
              api.visit.getUserRequests(user.user_id).then(visitRes => {
                if (visitRes.success && Array.isArray(visitRes.data)) {
                  const currentVisit = visitRes.data.find((v: any) => v.location && v.location.location_id === +id);
                  if (currentVisit) {
                    setVisitStatus(currentVisit.status);
                  }
                }
              }).catch(err => console.error("Visit check error", err));
            }
          } else {
            setSelectedLocation(null);
          }
        })
        .catch(err => {
            console.error("Detail load error", err);
            setSelectedLocation(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setSelectedLocation(null);
    }
  }, [id, user]);

  // Log View Behavior (AI Training)
  useEffect(() => {
    if (isAuthenticated && user && id) {
        api.client.post('/behavior/log', {
            userId: user.user_id,
            locationId: +id,
            action: 'VIEW'
        }).catch(() => {});
      // Fetch similar locations from API
      api.location.getSimilar(+id, 4).then(res => {
        if (res.success && Array.isArray(res.data)) {
          setSimilarPlaces(res.data);
        }
      });
    }
  }, [id, isAuthenticated, user]);

  const { addItem } = useTripStore();

  const handleGetDirections = async () => {
    if (!coords) {
      setRouteError("Không thể lấy vị trí hiện tại của bạn. Vui lòng bật GPS.");
      return;
    }
    if (!selectedLocation) return;

    setDirectionLoading(true);
    setRouteError(null);
    try {
      const routeData = await externalApi.getDirections(
        coords.lat, coords.lng,
        selectedLocation.latitude, selectedLocation.longitude
      );

      if (routeData) {
        setRoute(routeData);
      } else {
        setRouteError("Không tìm được đường đi. Vui lòng thử lại sau.");
      }
    } catch (err) {
      setRouteError("Lỗi khi gọi API chỉ đường.");
    } finally {
      setDirectionLoading(false);
    }
  };

  if (loading || !selectedLocation) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  const handleBooking = () => {
    if (selectedLocation) {
        addItem(selectedLocation);
        navigate('/planner');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: selectedLocation.name,
      text: selectedLocation.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      alert("Vui lòng đăng nhập để lưu địa điểm!");
      return;
    }

    const res = await api.favorite.toggle(user.user_id, selectedLocation.location_id);
    if (res.success) {
      setIsFavorited(res.data);
    }
  };

    const distance = calculateDistance(selectedLocation?.latitude || 0, selectedLocation?.longitude || 0);
  
  const passedMatchScore = routerLocation.state?.matchScore;
  const finalScore = passedMatchScore != null ? passedMatchScore : selectedLocation?.match_score;

  const similarLocations = (similarPlaces && similarPlaces.length > 0) ? similarPlaces : (locations || [])
    .filter(l => l.location_id !== selectedLocation?.location_id && l.category_id === selectedLocation?.category_id)
    .slice(0, 4);

  return (
    <div className="bg-[#FFFEFA] dark:bg-slate-950 min-h-screen pb-40">
      {/* Cinematic Hero Image Section */}
      <div className="relative h-[600px] lg:h-[750px] overflow-hidden">
        <img
          src={selectedLocation.thumbnail_url || (selectedLocation.images?.[0]) || 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80'}
          alt={selectedLocation.name}
          className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEFA] dark:from-slate-950 via-transparent to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end container mx-auto px-4 pb-32">
          <div className="max-w-4xl animate-in slide-in-from-bottom-12 duration-1000">
            <div className="mb-8 flex flex-wrap gap-4 items-center">
              {distance && (
                  <span className="px-5 py-2 bg-white/20 backdrop-blur-3xl border border-white/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl">
                      {humanizeDistance(coords?.lat, coords?.lng, selectedLocation.latitude, selectedLocation.longitude)}
                  </span>
              )}
              <span className="px-5 py-2 bg-primary-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                  {selectedLocation.category_name}
              </span>
            </div>
            <h1 className="text-6xl md:text-9xl font-serif font-black text-slate-900 dark:text-white mb-8 leading-[0.9] tracking-tighter">
                {selectedLocation.name}
            </h1>
                <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 bg-amber-400 text-white px-6 py-3 rounded-[2rem] font-black text-lg shadow-xl shadow-amber-400/20">
                    <Star className="w-6 h-6 fill-current" />
                    <span>{(selectedLocation?.average_rating || 0).toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Cộng đồng bình chọn</span>
                  <span className="text-slate-600 dark:text-slate-400 font-bold">{(selectedLocation?.total_reviews || 0)} nhận xét chi tiết</span>
                </div>
                
                {/* Algorithm Insights Badge */}
                {selectedLocation?.match_score != null && (
                  <div className="group relative">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-[2rem] font-black text-xs cursor-help">
                        <Info className="w-4 h-4 text-primary-400" />
                        <span>Match: {((selectedLocation?.match_score || 0) * 100).toFixed(0)}%</span>
                    </div>
                    
                    {/* Popover */}
                    <div className="absolute top-full left-0 mt-4 w-72 p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-4">Algorithm Insights (Academic)</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cosine Similarity (60%)</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">Tags: {(selectedLocation?.matched_tags || []).join(', ') || 'N/A'}</p>
                                </div>
                                <span className="text-sm font-black">{((selectedLocation?.similarity_score || 0) * 10).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Distance Score (30%)</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">Phạm vi ~{(selectedLocation?.distance_score ? (1/selectedLocation.distance_score - 1) : 0).toFixed(1)}km</p>
                                </div>
                                <span className="text-sm font-black">{((selectedLocation?.distance_score || 0) * 10).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Context Match (10%)</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">Time + Weather</p>
                                </div>
                                <span className="text-sm font-black">{((selectedLocation?.context_score || 0) * 10).toFixed(1)}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center">
                                <span className="text-xs font-black">Final Weighted Score</span>
                                <span className="text-lg font-black text-primary-600">{((selectedLocation?.match_score || 0) * 10).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Storytelling & Content */}
          <div className="lg:col-span-8 space-y-24">
                {/* About Section */}
                <section>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                        <div className="max-w-2xl">
                          <h2 className="text-5xl font-serif italic text-slate-900 dark:text-white mb-6 leading-tight">“Câu chuyện về <br/>{selectedLocation.name}.”</h2>
                          <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                              {selectedLocation.description}
                          </p>
                        </div>
                        <div className="flex gap-4 self-end md:self-start">
                            <button
                                onClick={handleShare}
                                className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all flex items-center justify-center airy-shadow"
                            >
                                {isShared ? <Check className="w-6 h-6 text-green-500" /> : <Share2 className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className={`w-14 h-14 rounded-3xl transition-all flex items-center justify-center airy-shadow ${isFavorited ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 dark:bg-slate-900'}`}
                            >
                                <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Preview Experience (Highlight) */}
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-[4rem] p-12 lg:p-20 mb-20 border border-primary-100/50 relative overflow-hidden group">
                        <Sparkles className="absolute -top-10 -right-10 w-40 h-40 text-primary-200/30 dark:text-primary-800/20 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary-600 mb-10">Một ngày ở đây sẽ như thế nào?</h3>
                            <p className="text-2xl md:text-3xl text-slate-800 dark:text-slate-200 font-serif italic leading-[1.6]">
                                {selectedLocation.preview_experience || `Hãy tưởng tượng bạn bắt đầu buổi sáng tại ${selectedLocation.name}, hít hà không khí trong lành và bắt đầu hành trình khám phá những điều thú vị nhất tại đây. Từng góc nhỏ nơi này đều mang trong mình một câu chuyện riêng đang chờ bạn viết tiếp...`}
                            </p>
                        </div>
                    </div>

                    {/* Multi-Image Gallery */}
                    {selectedLocation.images && selectedLocation.images.length > 0 && (
                        <div className="space-y-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Thư viện khoảnh khắc</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {selectedLocation.images.map((img, idx) => (
                                    <div key={idx} className={`rounded-[3rem] overflow-hidden airy-shadow group cursor-pointer ${idx % 3 === 0 ? 'md:col-span-2 aspect-[21/9]' : 'aspect-square'}`}>
                                        <img src={img} alt={`${selectedLocation.name}-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Map & Access */}
                <section>
                  <div className="mb-12">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Vị trí & Chỉ đường</h2>
                    <p className="text-slate-500 font-medium">Toạ lạc tại {selectedLocation.address}, {selectedLocation.province}.</p>
                  </div>
                  <div className="h-[400px] mb-8 overflow-hidden rounded-[2rem] bg-slate-100 group relative">
                    {/* Ensure coordinates are numbers and not null before rendering. Force remount on ID change to avoid Leaflet sync issues. */}
                    {selectedLocation && 
                     typeof selectedLocation.latitude === 'number' && 
                     typeof selectedLocation.longitude === 'number' &&
                     selectedLocation.latitude !== 0 &&
                     selectedLocation.longitude !== 0 ? (
                      <MapView 
                        key={`map-${selectedLocation.location_id}-${selectedLocation.latitude}-${selectedLocation.longitude}`}
                        locations={[selectedLocation]}
                        center={[selectedLocation.latitude, selectedLocation.longitude]}
                        route={route}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                          <MapPin className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-xs font-black uppercase tracking-widest">Toạ độ không khả dụng cho địa điểm này.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Community Section */}
                <section className="pt-20 border-t border-slate-100 dark:border-slate-900">
                    <ReviewSection locationId={selectedLocation.location_id} />
                </section>
          </div>

          {/* Right Column: Sticky Info & CTA */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-10 shadow-2xl border border-slate-50 dark:border-slate-800 sticky top-32 airy-shadow">
              <div className="mb-12 pb-12 border-b border-slate-50 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Thông tin cần thiết</h3>
                <div className="space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Thời gian hoạt động</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">
                        {selectedLocation.opening_hour?.slice(0, 5)} - {selectedLocation.closing_hour?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                         <DollarSign className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Chi phí dự kiến</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">{selectedLocation.price_range_str || 'Cập nhật tại điểm'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <button
                  onClick={() => setIsBookingOpen(true)}
                  disabled={visitStatus === 'PENDING'}
                  className={cn(
                    "w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3",
                    visitStatus === 'APPROVED' || visitStatus === 'COMPLETED' 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : visitStatus === 'PENDING'
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  {visitStatus === 'PENDING' ? (
                    <>Đang chờ duyệt...</>
                  ) : visitStatus === 'APPROVED' || visitStatus === 'COMPLETED' ? (
                    <>Đã duyệt (Có thể đánh giá)</>
                  ) : (
                    <><Calendar className="w-5 h-5" /> Đăng ký tham quan</>
                  )}
                </button>

                <button
                  onClick={handleBooking}
                  className="w-full py-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:border-primary-500 flex items-center justify-center gap-3"
                >
                  <PlusCircle className="w-5 h-5 text-primary-500" /> Thêm vào lịch trình
                </button>

                <button
                  onClick={handleGetDirections}
                  disabled={directionLoading}
                  className="w-full py-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-primary-500 text-slate-900 dark:text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all flex justify-center items-center gap-3"
                >
                  {directionLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" /> Chỉ đường đi
                    </>
                  )}
                </button>
                {routeError && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{routeError}</p>}
              </div>

              <div className="mt-12 text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gợi ý cho bạn vì bạn thích <br/> {selectedLocation.category_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Discovery */}
        <section className="mt-40 pt-20 border-t border-slate-100 dark:border-slate-900">
             <div className="mb-16">
                <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-8">Địa điểm tương tự</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {(similarLocations || []).map((loc, idx) => (
                  <LocationCard key={idx} location={loc} />
                ))}
             </div>
        </section>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        locationId={selectedLocation.location_id}
        locationName={selectedLocation.name}
      />
    </div>
  );
}