import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MapView from '../components/MapView';
import RatingStars from '../components/RatingStars';
import ReviewSection from '../components/ReviewSection';
import LocationList from '../components/LocationList';
import BookingModal from '../components/BookingModal';
import { useLocationStore } from '../store/useLocationStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { api } from '../api';
import { externalApi } from '../api/external';
import { MapPin, Clock, DollarSign, Calendar, Heart, Share2 } from 'lucide-react';

export default function Detail() {
  const { id } = useParams();
  const { selectedLocation, setSelected, setLoading, loading, locations } = useLocationStore();
  const { calculateDistance, coords } = useGeoLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Routing State
  const [route, setRoute] = useState<any>(null);
  const [directionLoading, setDirectionLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    // Reset route when location changes
    setRoute(null);
    setRouteError(null);

    if (id) {
      setLoading(true);
      api.location.getById(+id)
        .then(res => setSelected(res.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !selectedLocation) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

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
        setRouteError("Không tìm được đường đi (Demo Token có thể hết hạn hoặc API lỗi).");
      }
    } catch (err) {
      setRouteError("Lỗi khi gọi API chỉ đường.");
    } finally {
      setDirectionLoading(false);
    }
  };

  const handleBooking = () => {
    setIsBookingOpen(true);
  };

  const distance = calculateDistance(selectedLocation.latitude, selectedLocation.longitude);

  // Logic for similar locations (excluding current one)
  const similarLocations = locations
    .filter(l => l.location_id !== selectedLocation.location_id && l.category_id === selectedLocation.category_id)
    .slice(0, 4);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 pt-16 lg:pt-20">
      {/* Hero Image Section */}
      <div className="relative h-[400px] lg:h-[500px]">
        <img
          src={selectedLocation.thumbnail_url || 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3'}
          alt={selectedLocation.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex gap-2">
                <span className="px-3 py-1 bg-primary-600/90 rounded-full text-xs font-bold backdrop-blur-sm">
                  Gợi ý cho bạn: {selectedLocation.match_score || 98}% phù hợp
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                  Dựa trên sở thích
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 drop-shadow-md">{selectedLocation.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  <span>{selectedLocation.province}</span>
                  {distance && <span className="text-slate-300">• Cách bạn {distance} km</span>}
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars rating={selectedLocation.average_rating} size={18} />
                  <span className="font-bold">{selectedLocation.average_rating.toFixed(1)}</span>
                  <span className="opacity-80">({selectedLocation.total_reviews} đánh giá)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Giới thiệu</h2>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors hover:text-red-500">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {selectedLocation.description}
              </p>
            </div>

            {/* Map Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6">Vị trí</h2>
              <div className="h-[400px] rounded-xl overflow-hidden shadow-inner">
                <MapView
                  locations={[selectedLocation]}
                  center={[selectedLocation.latitude, selectedLocation.longitude]}
                  route={route}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-800 sticky top-24">
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Thông tin chi tiết</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <span className="block font-medium text-slate-700 dark:text-slate-200">Giờ mở cửa</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {selectedLocation.opening_hour || '08:00'} - {selectedLocation.closing_hour || '22:00'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <span className="block font-medium text-slate-700 dark:text-slate-200">Giá vé</span>
                      <span className="text-slate-500 dark:text-slate-400">{selectedLocation.price_range_str || 'Miễn phí'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <span className="block font-medium text-slate-700 dark:text-slate-200">Thời điểm tốt nhất</span>
                      <span className="text-slate-500 dark:text-slate-400">Tháng 1 - Tháng 4</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBooking}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-600/30"
                >
                  Thêm vào lịch trình / Đặt chỗ
                </button>

                <button
                  onClick={handleGetDirections}
                  disabled={directionLoading}
                  className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                >
                  {directionLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Chỉ đường (Demo)
                    </>
                  )}
                </button>
                {routeError && <p className="text-red-500 text-sm text-center">{routeError}</p>}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-3 mt-8">
            <ReviewSection locationId={selectedLocation.location_id} />
          </div>

          {/* Similar Locations */}
          <div className="lg:col-span-3 mt-8">
            <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
              <LocationList title="Địa điểm tương tự (Dựa trên nội dung)" locations={similarLocations} />
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        locationName={selectedLocation.name}
      />
    </div>
  );
}