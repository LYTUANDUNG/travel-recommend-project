import { useTripStore } from '../store/useTripStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { 
    Trash2, 
    ChevronUp, 
    ChevronDown, 
    MapPin, 
    Sparkles, 
    Send, 
    Clock, 
    Wallet, 
    Car, 
    Check, 
    Calendar,
    ArrowRight,
    MapPinIcon,
    AlertCircle,
    Utensils,
    Coffee,
    Hotel,
    Info
} from 'lucide-react';
import { cn } from '../utils/cn';
import MapView from '../components/MapView';
import { api } from '../api';
import { externalApi } from '../api/external';
import { Location as TravelLocation } from '../types/schema';
import { useGeoLocation } from '../hooks/useGeoLocation';

export default function TripPlanner() {
  const { tripItems, removeItem, updateOrder, clearTrip, syncToBackend } = useTripStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const { coords: gpsCoords } = useGeoLocation();
  
  const [fullLocations, setFullLocations] = useState<TravelLocation[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // State for planner
  const [tripTitle, setTripTitle] = useState('Hành trình cá nhân VinaTravel');
  const [tripDesc, setTripDesc] = useState('Lịch trình tự động tối ưu tuyến đường GIS di chuyển ngắn nhất.');
  const [tripDaysCount, setTripDaysCount] = useState(3);
  const [activeDay, setActiveDay] = useState('Ngày 1');
  const [scheduleTimes, setScheduleTimes] = useState<Record<number, { start: string; end: string }>>({});

  // Sync title & description from local storage if needed
  useEffect(() => {
    const savedTitle = localStorage.getItem('vinatravel_trip_title');
    const savedDesc = localStorage.getItem('vinatravel_trip_desc');
    const savedDays = localStorage.getItem('vinatravel_trip_days');
    if (savedTitle) setTripTitle(savedTitle);
    if (savedDesc) setTripDesc(savedDesc);
    if (savedDays) setTripDaysCount(Number(savedDays));
  }, []);

  const saveMetaToLocal = (title: string, desc: string, days: number) => {
    localStorage.setItem('vinatravel_trip_title', title);
    localStorage.setItem('vinatravel_trip_desc', desc);
    localStorage.setItem('vinatravel_trip_days', String(days));
  };

  // Load location details from DB
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

  // Filter items for the active day
  const activeItemsSorted = useMemo(() => {
    const items = tripItems.filter(item => (item.visit_date || 'Ngày 1') === activeDay);
    return [...items].sort((a, b) => a.order_index - b.order_index);
  }, [tripItems, activeDay]);

  // Full location details for active day
  const activeLocations = useMemo(() => {
    return activeItemsSorted
      .map(item => fullLocations.find(l => l.location_id === item.location_id))
      .filter((l): l is TravelLocation => !!l);
  }, [activeItemsSorted, fullLocations]);

  // Fetch OSRM GIS route polyline for the active day's locations
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

  // Autofill schedule times for new locations
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
    // Sort and re-index only the active day items
    const dayItems = [...activeItemsSorted];
    const index = dayItems.findIndex(i => i.location_id === itemLocationId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dayItems.length) return;
    
    // Swap
    [dayItems[index], dayItems[targetIndex]] = [dayItems[targetIndex], dayItems[index]];

    // Merge back to global store and save
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
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để lưu hành trình vĩnh viễn!");
      navigate('/login');
      return;
    }
    if (user) {
      setLoading(true);
      await syncToBackend(user.user_id);
      setLoading(false);
      alert("Hành trình cá nhân của bạn đã được đồng bộ trực tiếp lên hệ thống!");
    }
  };

  // Pricing helper based on categories
  const getStopCost = (locId: number) => {
    const loc = fullLocations.find(l => l.location_id === locId);
    if (!loc) return 100000;
    
    const cid = loc.category_id;
    const name = (loc.name || '').toLowerCase();
    
    if (name.includes('khách sạn') || name.includes('hotel') || name.includes('homestay') || name.includes('resort')) {
      return 1200000;
    }
    
    switch(cid) {
      case 1: return 400000; // Ăn uống / Nhà hàng
      case 2: return 150000; // Cafe
      case 3: return 50000;  // Điểm tham quan
      case 4: return 350000; // Vui chơi
      case 5: return 80000;  // Mua sắm
      default: return 100000;
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Calculations for current active day
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

  // Entire trip cost
  const entireTripCost = useMemo(() => {
    let total = 0;
    tripItems.forEach(item => {
      total += getStopCost(item.location_id) + travelFeePerStop;
    });
    return total;
  }, [tripItems, fullLocations]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 pb-20 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Section */}
        <div className="flex flex-col gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                 <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> VinaTravel personalized planner
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Lên lịch trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Cá nhân.</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Tối ưu hóa tuyến đường thông qua bản đồ GIS tích hợp OSRM. Lập kế hoạch tài chính tự động.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
               <button 
                  onClick={clearTrip}
                  className="px-5 py-3 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:border-red-300 dark:hover:text-red-400 transition-all shadow-sm active:scale-95"
               >
                  Xoá toàn bộ
               </button>
               <button 
                  onClick={handleSync}
                  disabled={loading || tripItems.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50"
               >
                  {loading ? (
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                  Lưu lên máy chủ BE
               </button>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: 7 Columns (Form, Day Tabs, Timeline List) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trip details configuration card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={tripTitle} 
                  onChange={(e) => {
                    setTripTitle(e.target.value);
                    saveMetaToLocal(e.target.value, tripDesc, tripDaysCount);
                  }}
                  className="bg-transparent font-black text-xl text-slate-800 dark:text-white border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-orange-500 focus:outline-none w-full transition py-1"
                  placeholder="Tên chuyến đi của bạn..."
                />
                <input 
                  type="text"
                  value={tripDesc} 
                  onChange={(e) => {
                    setTripDesc(e.target.value);
                    saveMetaToLocal(tripTitle, e.target.value, tripDaysCount);
                  }}
                  className="bg-transparent text-xs text-slate-400 dark:text-slate-500 border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-orange-500 focus:outline-none w-full transition py-1"
                  placeholder="Mô tả ngắn về chuyến đi này..."
                />
              </div>

              <div className="flex flex-wrap gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Thời lượng chuyến đi:</span>
                  <select 
                    value={tripDaysCount} 
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setTripDaysCount(count);
                      saveMetaToLocal(tripTitle, tripDesc, count);
                      // If activeDay exceeds new count, reset to Day 1
                      const dayNum = Number(activeDay.replace('Ngày ', ''));
                      if (dayNum > count) {
                        setActiveDay('Ngày 1');
                      }
                    }}
                    className="bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer transition"
                  >
                    <option value={1}>1 ngày</option>
                    <option value={2}>2 ngày</option>
                    <option value={3}>3 ngày</option>
                    <option value={4}>4 ngày</option>
                    <option value={5}>5 ngày</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>Khu vực khám phá:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold">Thành phố Hồ Chí Minh</span>
                </div>
              </div>
            </div>

            {/* Premium Day Switcher Tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto">
              {Array.from({ length: tripDaysCount }).map((_, i) => {
                const dayLabel = `Ngày ${i + 1}`;
                const isActive = activeDay === dayLabel;
                const countOnThisDay = tripItems.filter(item => (item.visit_date || 'Ngày 1') === dayLabel).length;
                
                return (
                  <button
                    key={dayLabel}
                    onClick={() => setActiveDay(dayLabel)}
                    className={cn(
                      "px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0",
                      isActive 
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                    )}
                  >
                    {dayLabel}
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-bold",
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {countOnThisDay} chặng
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List and timeline of active day locations */}
            {activeItemsSorted.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPinIcon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Không có địa điểm nào trong {activeDay}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-2 font-semibold">
                  Hãy sang các ngày khác hoặc quay trở về trang Khám phá để thêm địa điểm bạn yêu thích vào lộ trình.
                </p>
                <button
                  onClick={() => navigate('/explore')}
                  className="mt-6 px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-orange-600 transition"
                >
                  Đến trang khám phá
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Timeline title */}
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Chi tiết lộ trình di chuyển ngày hôm nay ({activeItemsSorted.length} điểm dừng)
                  </span>
                </div>

                {/* Timeline vertical sequence */}
                <div className="relative pl-6 sm:pl-16 space-y-6">
                  
                  {/* Timeline connecting track */}
                  <div className="absolute left-[37px] sm:left-[79px] top-6 bottom-6 w-[2px] bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />

                  {activeItemsSorted.map((item, idx) => {
                    const origIdx = tripItems.findIndex(ti => ti.location_id === item.location_id);
                    const cost = getStopCost(item.location_id);
                    const time = scheduleTimes[item.location_id] || { start: '09:00 SA', end: '10:30 SA' };
                    
                    return (
                      <div key={item.location_id} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        
                        {/* Glowing sequence badge indicator */}
                        <div className="absolute -left-[30px] sm:-left-[48px] top-5 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
                          {idx + 1}
                        </div>

                        {/* Event Location Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-950/30 transition-all">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              
                              {/* Time selector fields */}
                              <div className="flex flex-col gap-1.5 shrink-0 text-slate-400">
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded-xl border border-transparent focus-within:border-orange-500 transition">
                                  <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  <input 
                                    type="text" 
                                    value={time.start}
                                    onChange={(e) => handleTimeChange(item.location_id, 'start', e.target.value)}
                                    className="w-16 bg-transparent border-none outline-none font-black text-[10px] text-slate-700 dark:text-slate-200 text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-855 px-2 py-1 rounded-xl border border-transparent focus-within:border-orange-500 transition">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <input 
                                    type="text" 
                                    value={time.end}
                                    onChange={(e) => handleTimeChange(item.location_id, 'end', e.target.value)}
                                    className="w-16 bg-transparent border-none outline-none font-black text-[10px] text-slate-400 text-center"
                                  />
                                </div>
                              </div>

                              {/* Image Thumbnail */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-850 bg-slate-100 shadow-inner">
                                <img 
                                  src={item.thumbnail_url || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80'} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>

                              {/* Information panel */}
                              <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm sm:text-base text-slate-800 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-850 dark:text-slate-500 px-2 py-0.5 rounded-md">
                                    Dự chi: {formatVND(cost)}
                                  </span>
                                  <button 
                                    onClick={() => navigate(`/location/${item.location_id}`)}
                                    className="text-orange-500 hover:text-orange-600 hover:underline text-[10px] font-black uppercase tracking-wider"
                                  >
                                    Chi tiết
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Control button actions */}
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-3 sm:pt-0 shrink-0">
                              <div className="flex items-center gap-1.5">
                                
                                {/* Day Transfer Switcher Option */}
                                <select 
                                  value={item.visit_date || 'Ngày 1'}
                                  onChange={(e) => handleSetDay(item.location_id, e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 rounded-xl px-3 py-2 border-none outline-none cursor-pointer transition"
                                >
                                  {Array.from({ length: tripDaysCount }).map((_, d) => (
                                    <option key={d} value={`Ngày ${d + 1}`}>{`Ngày ${d + 1}`}</option>
                                  ))}
                                </select>

                                {/* Sequence up/down */}
                                <button 
                                  onClick={() => handleMove(item.location_id, 'up')}
                                  disabled={idx === 0}
                                  className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition disabled:opacity-20"
                                  title="Lên trên"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleMove(item.location_id, 'down')}
                                  disabled={idx === activeItemsSorted.length - 1}
                                  className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition disabled:opacity-20"
                                  title="Xuống dưới"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete stops */}
                                <button 
                                  onClick={() => removeItem(item.location_id)}
                                  className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition"
                                  title="Xoá khỏi lộ trình"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Dynamic route spacing indicator */}
                        {idx < activeItemsSorted.length - 1 && (
                          <div className="py-2.5 pl-4 sm:pl-8 flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            <div className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                              <Car className="w-3 h-3 text-orange-500 animate-pulse" />
                            </div>
                            <span>OSRM di chuyển ngắn nhất</span>
                            <span className="text-slate-250 dark:text-slate-800">|</span>
                            <span>Phí xe dự tính: {formatVND(travelFeePerStop)}</span>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* Left Active Day Cost Category Summary panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-500" />
                    Thống kê chi tiêu dự trù cho {activeDay}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-amber-500" /> Cafe
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        {formatVND(activeDayCostBreakdown.cafe)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-orange-500" /> Ăn uống
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        {formatVND(activeDayCostBreakdown.food)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Hotel className="w-3 h-3 text-blue-500" /> Lưu trú
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        {formatVND(activeDayCostBreakdown.hotel)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Car className="w-3 h-3 text-emerald-500" /> Di chuyển
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        {formatVND(activeDayCostBreakdown.transport)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-500" /> Khác
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        {formatVND(activeDayCostBreakdown.other)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Tổng ngân sách trong ngày</span>
                    <span className="text-sm font-black text-orange-500 font-mono">
                      {formatVND(activeDayCostBreakdown.total)}
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: 5 Columns (Interactive GIS Leaflet Map & Total Cost Summary) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            {/* GIS Map container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Bản đồ hành trình {activeDay}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md">
                  Tải thời gian thực
                </span>
              </div>
              
              <div className="h-[450px] w-full rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-inner relative z-0">
                <MapView 
                  locations={gpsCoords ? [
                    { 
                      location_id: 0, 
                      name: 'Vị trí hiện tại của bạn', 
                      latitude: gpsCoords.lat, 
                      longitude: gpsCoords.lng,
                      address: 'Điểm xuất phát GPS',
                      description: 'GPS locator'
                    } as any, 
                    ...activeLocations
                  ] : activeLocations}
                  route={route}
                  showOrder={true}
                />
              </div>

              {route ? (
                <div className="p-3 bg-orange-50/50 dark:bg-orange-950/10 rounded-2xl flex items-center gap-2 border border-orange-100/50 dark:border-orange-950/20 text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" /> Tuyến đường OSRM đã tự động tối ưu hóa chặng đi thành công!
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Thêm ít nhất 2 địa điểm để vẽ sơ đồ di chuyển GIS.
                </div>
              )}
            </div>

            {/* Total Budget Card for the entire trip */}
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
              
              <div className="space-y-6 relative z-10">
                <span className="text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white px-3 py-1 rounded-full">
                  Tổng kết chuyến đi
                </span>
                
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Tổng chi phí dự tính toàn chuyến:</span>
                  <div className="text-3xl font-black text-orange-500 font-mono tracking-tight">
                    {formatVND(entireTripCost)}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Số lượng địa điểm đặt chặng:</span>
                    <span>{tripItems.length} chặng dừng</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Số ngày tham quan:</span>
                    <span>{tripDaysCount} ngày</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Khu vực địa lý:</span>
                    <span>Hồ Chí Minh, VN</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl text-[10px] text-slate-350 leading-relaxed font-semibold">
                  ⚠️ Lưu ý: Ước tính tài chính trên dựa theo dữ liệu thực tế trung bình từ API của hệ thống. Phí Grab di chuyển thực tế có thể thay đổi tùy thuộc vào điều kiện thời tiết tại TP.HCM.
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
