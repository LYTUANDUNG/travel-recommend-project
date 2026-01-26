import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MapView from '../components/MapView';
import RatingStars from '../components/RatingStars';
import ReviewSection from '../components/ReviewSection';
import LocationList from '../components/LocationList';
import BookingModal from '../components/BookingModal';
import { useLocationStore } from '../store/useLocationStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { fetchLocationById } from '../api/client';
import { MapPin, Clock, DollarSign, Calendar, Heart, Share2 } from 'lucide-react';

export default function Detail() {
  const { id } = useParams();
  const { selectedLocation, setSelected, setLoading, loading, locations } = useLocationStore();
  const { calculateDistance } = useGeoLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchLocationById(+id)
        .then(setSelected)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !selectedLocation) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  const handleBooking = () => {
    setIsBookingOpen(true);
  };

  const distance = calculateDistance(selectedLocation.latitude, selectedLocation.longitude);

  // Logic for similar locations (excluding current one)
  const similarLocations = locations
    .filter(l => l.id !== selectedLocation.id && l.category === selectedLocation.category)
    .slice(0, 4);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-16 lg:pt-20">
      {/* Hero Image Section */}
      <div className="relative h-[400px] lg:h-[500px]">
        <img
          src={selectedLocation.image || 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3'}
          alt={selectedLocation.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex gap-2">
                <span className="px-3 py-1 bg-primary-600/90 rounded-full text-xs font-bold backdrop-blur-sm">
                  Gợi ý cho bạn: 98% phù hợp
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                  Dựa trên sở thích "Thiên nhiên"
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 drop-shadow-md">{selectedLocation.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  <span>{selectedLocation.city}</span>
                  {distance && <span className="text-slate-300">• Cách bạn {distance} km</span>}
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars rating={selectedLocation.rating_avg} size={18} />
                  <span className="font-bold">{selectedLocation.rating_avg.toFixed(1)}</span>
                  <span className="opacity-80">({selectedLocation.rating_count} đánh giá)</span>
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
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-serif font-bold text-slate-900">Giới thiệu</h2>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors hover:text-red-500">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                {selectedLocation.description}
              </p>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Vị trí</h2>
              <div className="h-[400px] rounded-xl overflow-hidden shadow-inner">
                <MapView locations={[selectedLocation]} center={[selectedLocation.latitude, selectedLocation.longitude]} />
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 sticky top-24">
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-xl font-bold mb-4">Thông tin chi tiết</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <span className="block font-medium text-slate-700">Giờ mở cửa</span>
                      <span className="text-slate-500">08:00 - 22:00</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <span className="block font-medium text-slate-700">Giá vé</span>
                      <span className="text-slate-500">{selectedLocation.priceRange || 'Miễn phí'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <span className="block font-medium text-slate-700">Thời điểm tốt nhất</span>
                      <span className="text-slate-500">Tháng 1 - Tháng 4</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBooking}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-600/30"
              >
                Thêm vào lịch trình / Đặt chỗ
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-3 mt-8">
            <ReviewSection locationId={selectedLocation.id} />
          </div>

          {/* Similar Locations */}
          <div className="lg:col-span-3 mt-8">
            <div className="border-t border-slate-200 pt-8">
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