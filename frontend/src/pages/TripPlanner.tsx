import { useTripStore } from '../store/useTripStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { encodeId } from '../utils/obfuscate';
import { 
    Trash2, 
    ChevronUp, 
    ChevronDown, 
    ChevronRight,
    MapPin, 
    Sparkles, 
    Send, 
    Clock, 
    Wallet, 
    Car, 
    Calendar,
    ArrowRight,
    MapPinIcon,
    Utensils,
    Coffee,
    Hotel,
    Info,
    Mail,
    X,
    Copy,
    Check
} from 'lucide-react';
import { cn } from '../utils/cn';
import MapView from '../components/MapView';
import { api } from '../api';
import { externalApi } from '../api/external';
import { Location as TravelLocation } from '../types/schema';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function TripPlanner() {
  const { tripItems, removeItem, updateOrder, clearTrip, syncToBackend } = useTripStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const { coords: gpsCoords } = useGeoLocation();
  
  const [fullLocations, setFullLocations] = useState<TravelLocation[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pastTrips, setPastTrips] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      api.client.get('/trips/my').then(res => {
        if (res.data && res.data.success) {
          setPastTrips(res.data.data);
        }
      }).catch(err => {
        console.error("Lỗi khi tải lịch sử chuyến đi", err);
      });
    }
  }, [isAuthenticated, user]);

  const handleLoadPastTrip = (trip: any) => {
    const items = (trip.tripLocations || []).map((tl: any, idx: number) => ({
      location_id: tl.location?.location_id || tl.location?.locationId || tl.locationId,
      name: tl.location?.name || '',
      thumbnail_url: tl.location?.thumbnail_url || (tl.location?.images?.[0]),
      order_index: tl.sortOrder || idx,
      visit_date: `Ngày ${tl.day || 1}`
    }));
    useTripStore.setState({ tripItems: items });
    setTripTitle(trip.title || 'Hành trình cá nhân VinaTravel');
    setTripDesc(trip.description || 'Lịch trình tự động tối ưu tuyến đường GIS di chuyển ngắn nhất.');
    const maxDay = Math.max(...(trip.tripLocations || []).map((tl: any) => tl.day || 1), 3);
    setTripDaysCount(Math.min(maxDay, 5));
    alert(`Đã tải thành công chuyến đi "${trip.title || 'Không tên'}" vào bảng lập kế hoạch!`);
  };
  
  const [tripTitle, setTripTitle] = useState('Hành trình cá nhân VinaTravel');
  const [tripDesc, setTripDesc] = useState('Lịch trình tự động tối ưu tuyến đường GIS di chuyển ngắn nhất.');
  const [tripDaysCount, setTripDaysCount] = useState(3);
  const [activeDay, setActiveDay] = useState('Ngày 1');
  const [scheduleTimes, setScheduleTimes] = useState<Record<number, { start: string; end: string }>>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedTitle = localStorage.getItem('vinatravel_trip_title');
    let savedDesc = localStorage.getItem('vinatravel_trip_desc');
    const savedDays = localStorage.getItem('vinatravel_trip_days');
    if (savedTitle) setTripTitle(savedTitle);
    if (savedDesc) {
      if (savedDesc.includes("tích hợp OSRM") || savedDesc.includes("Tối ưu hóa tuyến đường") || savedDesc.includes("tài chính tự động")) {
        savedDesc = 'Lịch trình tự động tối ưu tuyến đường GIS di chuyển ngắn nhất.';
        localStorage.setItem('vinatravel_trip_desc', savedDesc);
      }
      setTripDesc(savedDesc);
    }
    if (savedDays) setTripDaysCount(Number(savedDays));
  }, []);

  const saveMetaToLocal = (title: string, desc: string, days: number) => {
    localStorage.setItem('vinatravel_trip_title', title);
    localStorage.setItem('vinatravel_trip_desc', desc);
    localStorage.setItem('vinatravel_trip_days', String(days));
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (tripItems.length === 0) {
        setFullLocations([]);
        setRoute(null);
        return;
      }
      try {
        const res = await api.location.getByIds(tripItems.map(item => item.location_id));
        const locations = res.success && Array.isArray(res.data) ? res.data : [];
        setFullLocations(locations);
      } catch (error) {
        console.error("Failed to load trip details", error);
      }
    };
    loadDetails();
  }, [tripItems]);

  const activeItemsSorted = useMemo(() => {
    const items = tripItems.filter(item => (item.visit_date || 'Ngày 1') === activeDay);
    return [...items].sort((a, b) => a.order_index - b.order_index);
  }, [tripItems, activeDay]);

  const activeLocations = useMemo(() => {
    return activeItemsSorted
      .map(item => fullLocations.find(l => l.location_id === item.location_id))
      .filter((l): l is TravelLocation => !!l);
  }, [activeItemsSorted, fullLocations]);

  useEffect(() => {
    const loadRoute = async () => {
      if (activeLocations.length < 2) {
        setRoute(null);
        return;
      }
      try {
        let coordsArray = activeLocations.map(l => `${l.longitude},${l.latitude}`);
        if (gpsCoords) {
          coordsArray = [`${gpsCoords.lng},${gpsCoords.lat}`, ...coordsArray];
        }
        if (coordsArray.length >= 2) {
          const coordsString = coordsArray.join(';');
          const routeData = await externalApi.getDirectionsSeq(coordsString);
          setRoute(routeData);
        } else {
          setRoute(null);
        }
      } catch (err) {
        console.error("OSRM Route fetch error", err);
        setRoute(null);
      }
    };
    loadRoute();
  }, [activeLocations, gpsCoords]);

  useEffect(() => {
    const newTimes = { ...scheduleTimes };
    let updated = false;

    tripItems.forEach((item, index) => {
      if (!newTimes[item.location_id]) {
        const baseHour = 9 + (index * 3);
        const rawHour = baseHour > 24 ? baseHour - 24 : baseHour;
        const startHour = rawHour > 12 ? rawHour - 12 : rawHour;
        const startPeriod = rawHour >= 12 && rawHour < 24 ? 'CH' : 'SA';
        
        const rawEndHour = rawHour + 1.5;
        const displayEndHour = rawEndHour > 12 ? (rawEndHour > 24 ? rawEndHour - 24 : rawEndHour - 12) : rawEndHour;
        const endPeriod = rawEndHour >= 12 && rawEndHour < 24 ? 'CH' : 'SA';

        newTimes[item.location_id] = {
          start: `${String(Math.floor(startHour)).padStart(2, '0')}:00 ${startPeriod}`,
          end: `${String(Math.floor(displayEndHour)).padStart(2, '0')}:30 ${endPeriod}`
        };
        updated = true;
      }
    });

    if (updated) {
      setScheduleTimes(newTimes);
    }
  }, [tripItems]);

  const handleMove = (itemLocationId: number, direction: 'up' | 'down') => {
    const dayItems = [...activeItemsSorted];
    const index = dayItems.findIndex(i => i.location_id === itemLocationId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dayItems.length) return;
    
    [dayItems[index], dayItems[targetIndex]] = [dayItems[targetIndex], dayItems[index]];

    const otherItems = tripItems.filter(item => (item.visit_date || 'Ngày 1') !== activeDay);
    const merged = [...otherItems, ...dayItems];
    updateOrder(merged);
  };

  const handleSetDay = (locationId: number, dayStr: string) => {
    const updated = tripItems.map(item => 
      item.location_id === locationId ? { ...item, visit_date: dayStr } : item
    );
    updateOrder(updated);
  };

  const handleTimeChange = (locationId: number, field: 'start' | 'end', value: string) => {
    setScheduleTimes(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        [field]: value
      }
    }));
  };

  const handleSync = async () => {
    if (!isAuthenticated || !user) {
      alert("Vui lòng đăng nhập để lưu hành trình!");
      navigate('/login');
      return;
    }
    const uid = user.user_id;
    if (uid) {
      setLoading(true);
      await syncToBackend(uid);
      
      api.client.get('/trips/my').then(res => {
        if (res.data && res.data.success) {
          setPastTrips(res.data.data);
        }
      }).catch(err => {
        console.error("Lỗi khi tải lịch sử chuyến đi", err);
      });

      setLoading(false);
      alert("Hành trình cá nhân của bạn đã được đồng bộ trực tiếp lên hệ thống!");
    }
  };



  const getStopCost = (locId: number) => {
    const loc = fullLocations.find(l => l.location_id === locId);
    if (!loc) return 100000;
    
    const cid = loc.category_id;
    const name = (loc.name || '').toLowerCase();
    
    if (name.includes('khách sạn') || name.includes('hotel') || name.includes('homestay') || name.includes('resort')) {
      return 1200000;
    }
    
    switch(cid) {
      case 1: return 400000;
      case 2: return 150000;
      case 3: return 50000;
      case 4: return 350000;
      case 5: return 80000;
      default: return 100000;
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const travelFeePerStop = 80000;
  
  const activeDayCostBreakdown = useMemo(() => {
    let cafeCost = 0;
    let foodCost = 0;
    let hotelCost = 0;
    let otherCost = 0;
    let transport = 0;

    activeItemsSorted.forEach(item => {
      const loc = fullLocations.find(l => l.location_id === item.location_id);
      const stopCost = getStopCost(item.location_id);
      transport += travelFeePerStop;

      if (!loc) {
        otherCost += stopCost;
        return;
      }

      const name = (loc.name || '').toLowerCase();
      if (name.includes('khách sạn') || name.includes('hotel') || name.includes('homestay') || name.includes('resort')) {
        hotelCost += stopCost;
      } else if (loc.category_id === 1) {
        foodCost += stopCost;
      } else if (loc.category_id === 2) {
        cafeCost += stopCost;
      } else {
        otherCost += stopCost;
      }
    });

    return {
      cafe: cafeCost,
      food: foodCost,
      hotel: hotelCost,
      other: otherCost,
      transport: transport,
      total: cafeCost + foodCost + hotelCost + otherCost + transport
    };
  }, [activeItemsSorted, fullLocations]);

  const entireTripCost = useMemo(() => {
    let total = 0;
    tripItems.forEach(item => {
      total += getStopCost(item.location_id) + travelFeePerStop;
    });
    return total;
  }, [tripItems, fullLocations]);

  const emailBodyText = useMemo(() => {
    if (tripItems.length === 0) return '';
    const days = Array.from({ length: tripDaysCount }).map((_, i) => `Ngày ${i + 1}`);
    
    let emailBody = `Xin chào!\n\nĐây là lịch trình du lịch cá nhân của tôi từ VinaTravel:\n\n`;
    emailBody += `Tên chuyến đi: ${tripTitle}\n`;
    emailBody += `Mô tả: ${tripDesc}\n`;
    emailBody += `Tổng chi phí dự tính: ${formatVND(entireTripCost)}\n\n`;
    
    days.forEach(day => {
      const itemsForDay = tripItems
        .filter(item => (item.visit_date || 'Ngày 1') === day)
        .sort((a, b) => a.order_index - b.order_index);
        
      if (itemsForDay.length > 0) {
        emailBody += `=== ${day} ===\n`;
        itemsForDay.forEach((item, idx) => {
          const loc = fullLocations.find(l => l.location_id === item.location_id);
          const time = scheduleTimes[item.location_id] || { start: '09:00 SA', end: '10:30 SA' };
          const cost = getStopCost(item.location_id);
          
          emailBody += `${idx + 1}. ${item.name}\n`;
          emailBody += `   - Thời gian: ${time.start} - ${time.end}\n`;
          emailBody += `   - Địa chỉ: ${loc?.address || 'Chưa cập nhật'}\n`;
          emailBody += `   - Chi phí dự tính: ${formatVND(cost)}\n`;
          emailBody += `   - Danh mục: ${loc?.category_name || 'Khám phá'}\n\n`;
        });
      }
    });
    
    emailBody += `Chúc bạn có một chuyến đi vui vẻ!\nĐược tạo bởi VinaTravel.`;
    return emailBody;
  }, [tripItems, tripTitle, tripDesc, tripDaysCount, fullLocations, scheduleTimes, entireTripCost]);

  const handleShareEmail = () => {
    if (tripItems.length === 0) {
      alert("Lịch trình của bạn đang trống!");
      return;
    }
    setIsShareModalOpen(true);
    setCopied(false);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.trim()) {
      alert("Vui lòng nhập email người nhận!");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.client.post('/trips/share', {
        email: recipientEmail.trim(),
        title: tripTitle,
        content: emailBodyText
      });
      
      if (response.data && response.data.success) {
        alert("Đã gửi email chia sẻ lịch trình thành công!");
        setIsShareModalOpen(false);
        setRecipientEmail('');
      } else {
        alert("Gửi email thất bại: " + (response.data?.message || "Lỗi không xác định"));
      }
    } catch (error: any) {
      console.error("Lỗi khi gửi email", error);
      alert("Không thể gửi email: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyItinerary = () => {
    navigator.clipboard.writeText(emailBodyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy", err);
      alert("Không thể sao chép lịch trình. Bạn có thể sao chép thủ công từ khung xem trước.");
    });
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
        
        {/* Banner Section */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Lên lịch trình <span className="text-primary-500">Cá nhân.</span>
              </h1>
            </div>
            
            <div className="flex gap-2.5 items-center">
               <Button 
                  variant="outline"
                  onClick={clearTrip}
                  className="rounded-full px-5 py-2.5 text-xs"
               >
                  Xoá toàn bộ
               </Button>
               <Button 
                  variant="outline"
                  onClick={handleShareEmail}
                  disabled={tripItems.length === 0}
                  className="rounded-full px-5 py-2.5 text-xs flex items-center gap-1.5 border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
               >
                  <Mail className="w-3.5 h-3.5" />
                  Chia sẻ lộ trình
               </Button>
               <Button 
                  onClick={handleSync}
                  disabled={loading || tripItems.length === 0}
                  className="rounded-full px-6 py-2.5 text-xs shadow-md flex items-center gap-1.5"
               >
                  {loading ? (
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                  Lưu lộ trình
               </Button>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: 7 Columns (Journey builder timeline) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trip details configuration card */}
            <Card variant="raised" padding="md" className="flex flex-col gap-4">
              <div className="space-y-1">
                <input 
                  type="text" 
                  value={tripTitle} 
                  onChange={(e) => {
                    setTripTitle(e.target.value);
                    saveMetaToLocal(e.target.value, tripDesc, tripDaysCount);
                  }}
                  className="bg-transparent font-bold text-lg text-slate-900 dark:text-white border-b border-transparent hover:border-slate-200 focus:border-primary-500 focus:outline-none w-full transition py-1"
                  placeholder="Tên chuyến đi của bạn..."
                />
                <input 
                  type="text"
                  value={tripDesc} 
                  onChange={(e) => {
                    setTripDesc(e.target.value);
                    saveMetaToLocal(tripTitle, e.target.value, tripDaysCount);
                  }}
                  className="bg-transparent text-xs text-slate-400 border-b border-transparent hover:border-slate-200 focus:border-primary-500 focus:outline-none w-full transition py-1 font-medium"
                  placeholder="Mô tả ngắn về chuyến đi này..."
                />
              </div>

              <div className="flex flex-wrap gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>Thời lượng chuyến đi:</span>
                  <select 
                    value={tripDaysCount} 
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setTripDaysCount(count);
                      saveMetaToLocal(tripTitle, tripDesc, count);
                      const dayNum = Number(activeDay.replace('Ngày ', ''));
                      if (dayNum > count) {
                        setActiveDay('Ngày 1');
                      }
                    }}
                    className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer transition"
                  >
                    <option value={1}>1 ngày</option>
                    <option value={2}>2 ngày</option>
                    <option value={3}>3 ngày</option>
                    <option value={4}>4 ngày</option>
                    <option value={5}>5 ngày</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span>Khu vực khám phá:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold">Thành phố Hồ Chí Minh</span>
                </div>
              </div>
            </Card>

            {/* Strict Pill Day Switcher Tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-full p-1.5 shadow-sm flex items-center gap-2 overflow-x-auto">
              {Array.from({ length: tripDaysCount }).map((_, i) => {
                const dayLabel = `Ngày ${i + 1}`;
                const isActive = activeDay === dayLabel;
                const countOnThisDay = tripItems.filter(item => (item.visit_date || 'Ngày 1') === dayLabel).length;
                
                return (
                  <button
                    key={dayLabel}
                    onClick={() => setActiveDay(dayLabel)}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0",
                      isActive 
                        ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                        : "bg-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    {dayLabel}
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {countOnThisDay} dừng
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List and timeline of active day locations */}
            {activeItemsSorted.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">Không có địa điểm nào trong {activeDay}</h3>
                <p className="text-xs text-slate-450 max-w-sm mx-auto mt-2 font-semibold">
                  Quay lại trang khám phá và lưu địa điểm yêu thích để lên lộ trình.
                </p>
                <Button
                  onClick={() => navigate('/explore')}
                  className="mt-6 rounded-full"
                >
                  Đến trang khám phá
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lộ trình di chuyển chi tiết ngày hôm nay
                  </span>
                </div>

                {/* Timeline vertical layout */}
                <div className="relative pl-6 sm:pl-16 space-y-6">
                  
                  {/* Connect track line */}
                  <div className="absolute left-[20px] sm:left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

                  {activeItemsSorted.map((item, idx) => {
                    const cost = getStopCost(item.location_id);
                    const time = scheduleTimes[item.location_id] || { start: '09:00 SA', end: '10:30 SA' };
                    
                    return (
                      <div key={item.location_id} className="relative group">
                        
                        {/* Glowing sequence badge */}
                        <div className="absolute -left-[30px] sm:-left-[48px] top-5 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md ring-4 ring-primary-500/10">
                          {idx + 1}
                        </div>

                        {/* Stop Details Card */}
                        <Card variant="raised" padding="sm" className="relative hover:border-primary-500/20">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              
                              {/* Schedulers */}
                              <div className="flex flex-col gap-1.5 shrink-0 text-slate-400">
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                  <Clock className="w-3 h-3 text-primary-500 shrink-0" />
                                  <input 
                                    type="text" 
                                    value={time.start}
                                    onChange={(e) => handleTimeChange(item.location_id, 'start', e.target.value)}
                                    className="w-16 bg-transparent border-none outline-none font-bold text-[9px] text-slate-700 dark:text-slate-200 text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                  <Clock className="w-3 h-3 text-slate-450 shrink-0" />
                                  <input 
                                    type="text" 
                                    value={time.end}
                                    onChange={(e) => handleTimeChange(item.location_id, 'end', e.target.value)}
                                    className="w-16 bg-transparent border-none outline-none font-bold text-[9px] text-slate-450 text-center"
                                  />
                                </div>
                              </div>

                              {/* Thumbnail */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100">
                                <img 
                                  src={item.thumbnail_url || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80'} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                                    Dự chi: {formatVND(cost)}
                                  </span>
                                  <button 
                                    onClick={() => navigate(`/location/${encodeId(item.location_id)}`)}
                                    className="text-primary-500 hover:underline text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Chi tiết
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Action controllers */}
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <select 
                                  value={item.visit_date || 'Ngày 1'}
                                  onChange={(e) => handleSetDay(item.location_id, e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-650 rounded-lg px-2.5 py-1.5 border-none outline-none cursor-pointer"
                                >
                                  {Array.from({ length: tripDaysCount }).map((_, d) => (
                                    <option key={d} value={`Ngày ${d + 1}`}>{`Ngày ${d + 1}`}</option>
                                  ))}
                                </select>

                                <button 
                                  onClick={() => handleMove(item.location_id, 'up')}
                                  disabled={idx === 0}
                                  className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleMove(item.location_id, 'down')}
                                  disabled={idx === activeItemsSorted.length - 1}
                                  className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => removeItem(item.location_id)}
                                  className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </Card>

                        {/* Transport spacing indicator */}
                        {idx < activeItemsSorted.length - 1 && (
                          <div className="py-3 pl-4 flex items-center gap-2 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                            <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-505 flex items-center justify-center shrink-0">
                              <Car className="w-3.5 h-3.5 text-primary-500" />
                            </div>
                            <span>Tuyến đường OSRM tối ưu</span>
                            <span className="text-slate-200">•</span>
                            <span className="text-slate-500 font-bold">Chi phí Grab: {formatVND(travelFeePerStop)}</span>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* Day Cost Summary Card */}
                <Card variant="raised" padding="md" className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary-500" /> Thống kê chi tiêu dự trù cho {activeDay}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-amber-500" /> Cafe
                      </span>
                      <span className="text-xs font-bold mt-1 text-slate-800 dark:text-white">
                        {formatVND(activeDayCostBreakdown.cafe)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-primary-500" /> Ăn uống
                      </span>
                      <span className="text-xs font-bold mt-1 text-slate-800 dark:text-white">
                        {formatVND(activeDayCostBreakdown.food)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Hotel className="w-3 h-3 text-blue-500" /> Lưu trú
                      </span>
                      <span className="text-xs font-bold mt-1 text-slate-800 dark:text-white">
                        {formatVND(activeDayCostBreakdown.hotel)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Car className="w-3 h-3 text-emerald-500" /> Di chuyển
                      </span>
                      <span className="text-xs font-bold mt-1 text-slate-800 dark:text-white">
                        {formatVND(activeDayCostBreakdown.transport)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-500" /> Khác
                      </span>
                      <span className="text-xs font-bold mt-1 text-slate-800 dark:text-white">
                        {formatVND(activeDayCostBreakdown.other)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Tổng trong ngày</span>
                    <span className="text-sm font-bold text-primary-500 font-mono">
                      {formatVND(activeDayCostBreakdown.total)}
                    </span>
                  </div>
                </Card>



              </div>
            )}

          </div>

          {/* RIGHT COLUMN: 5 Columns (Sticky Interactive GIS Map & Total Cost Summary Card) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            
            {/* Dark background + gradient Budget Card with BIG total cost highlight */}
            <div className="bg-slate-950 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl" />
              
              <div className="space-y-4 relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-widest bg-primary-500 text-white px-2.5 py-1 rounded-full">
                  Tổng kết chuyến đi
                </span>
                
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Tổng chi phí dự tính toàn chuyến:</span>
                  {/* Highlight total cost BIG */}
                  <div className="text-4xl font-extrabold text-primary-500 font-mono tracking-tight">
                    {formatVND(entireTripCost)}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Số lượng địa điểm:</span>
                    <span className="text-white font-bold">{tripItems.length} chặng</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Số ngày tham quan:</span>
                    <span className="text-white font-bold">{tripDaysCount} ngày</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl text-[10px] text-slate-400 leading-relaxed font-semibold border border-slate-800">
                  ⚠️ Ước tính tài chính trên dựa theo dữ liệu thực tế trung bình từ API của hệ thống.
                </div>
              </div>
            </div>

            {/* GIS Map container */}
            <Card variant="raised" padding="sm" className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Bản đồ hành trình {activeDay}
                </span>
              </div>
              
              <div className="h-[380px] w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner relative z-0">
                <MapView 
                  locations={gpsCoords ? [
                    { 
                      location_id: 0, 
                      name: 'Vị trí hiện tại', 
                      latitude: gpsCoords.lat, 
                      longitude: gpsCoords.lng,
                      address: 'GPS coordinates locator',
                      description: 'GPS locator'
                    } as any, 
                    ...activeLocations
                  ] : activeLocations}
                  route={route}
                  showOrder={true}
                />
              </div>

              {route?.distance && (
                <div className="p-3 bg-primary-50/20 rounded-xl flex items-center gap-2 text-[10px] text-primary-600 font-bold uppercase tracking-wider">
                    <span>Khoảng cách: {(route.distance / 1000).toFixed(1)} km</span>
                </div>
              )}
            </Card>

            {/* Redesigned Permanent History Card */}
            <Card variant="raised" padding="md" className="space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" /> Lịch sử tạo lộ trình
                </h3>
                {isAuthenticated && pastTrips.length > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary-500 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded-md">
                    {pastTrips.length} hành trình
                  </span>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 font-semibold mb-3">Vui lòng đăng nhập để lưu và xem lại lịch sử lộ trình của bạn.</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/login')} className="rounded-full">Đăng nhập ngay</Button>
                </div>
              ) : pastTrips.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 font-semibold">Bạn chưa có lịch trình nào được lưu trên tài khoản này.</p>
                  <p className="text-[10px] text-slate-400/80 mt-1">Lập kế hoạch bên trái và click "Lưu lộ trình" để lưu lại!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[260px] overflow-y-auto pr-1">
                  {pastTrips.map((trip: any) => {
                    const stopCount = trip.tripLocations?.length || 0;
                    return (
                      <div 
                        key={trip.tripId || trip.id}
                        onClick={() => handleLoadPastTrip(trip)}
                        className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-500">
                            {trip.title || 'Hành trình không tên'}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-1">
                            {trip.description || 'Không có mô tả cho hành trình này.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-4">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">
                            {stopCount} chặng
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

          </div>

        </div>

        {/* Share Itinerary Email Preview Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800 flex flex-col">
              
              {/* Header */}
              <div className="relative h-28 bg-primary-500 overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 to-transparent"></div>
                <button 
                  onClick={() => setIsShareModalOpen(false)} 
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2 text-primary-100 text-xs font-bold uppercase tracking-widest mb-1">
                    <Mail className="w-3.5 h-3.5 text-primary-200" /> Chia sẻ lộ trình
                  </div>
                  <h3 className="font-bold text-lg text-white tracking-tight truncate">Gửi hành trình qua Email</h3>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 pb-8 flex-1 bg-white dark:bg-slate-900 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Email người nhận</label>
                  <input
                    type="email"
                    placeholder="VD: banbe@gmail.com, nguoidi@gmail.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary-500 focus:bg-white text-sm font-semibold transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Nội dung hành trình xem trước</label>
                  <textarea
                    readOnly
                    value={emailBodyText}
                    rows={8}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-850/85 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-mono leading-relaxed text-slate-600 dark:text-slate-350 outline-none resize-none no-scrollbar"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyItinerary}
                      className="flex-1 rounded-2xl h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Đã sao chép' : 'Sao chép hành trình'}
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSendEmail}
                      className="flex-1 rounded-2xl h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi Email
                    </Button>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => setIsShareModalOpen(false)}
                    className="w-full rounded-2xl h-11 text-xs font-bold uppercase tracking-wider"
                  >
                    Đóng cửa sổ
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}
    </div>
  );
}
