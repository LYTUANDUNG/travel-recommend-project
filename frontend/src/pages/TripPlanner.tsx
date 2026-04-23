import { useTripStore } from '../store/useTripStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Trash2, ChevronUp, ChevronDown, MapPin, Sparkles, Send, Clock, Map as MapIcon, List as ListIcon } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Load full location details for the map and calculations
  useEffect(() => {
    const loadDetails = async () => {
      if (tripItems.length === 0) {
        setFullLocations([]);
        setRoute(null);
        return;
      }
      
      try {
        const promises = tripItems.map(item => api.location.getById(item.location_id));
        const results = await Promise.all(promises);
        const locations = results.map(r => r.data).filter(l => l);
        setFullLocations(locations);
        
        // Fetch sequential route including current GPS position if available
        if (locations.length >= 1) {
            let coordsArray = locations.map(l => `${l.longitude},${l.latitude}`);
            
            // Prepend current location if GPS is active
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
        } else {
            setRoute(null);
        }
      } catch (error) {
        console.error("Failed to load trip details", error);
      }
    };
    
    loadDetails();
  }, [tripItems, gpsCoords]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...tripItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    updateOrder(newItems);
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
        alert("Hành trình của bạn đã được đồng bộ!");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEFA] dark:bg-slate-950 pt-32 pb-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
               Trip Builder v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white leading-tight">
              Lộ trình <br/><span className="text-primary-600">khám phá.</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4">
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl hidden md:flex">
                <button 
                    onClick={() => setViewMode('list')}
                    className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", 
                        viewMode === 'list' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400")}
                >
                    <ListIcon className="w-3 h-3" /> Danh sách
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", 
                        viewMode === 'map' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400")}
                >
                    <MapIcon className="w-3 h-3" /> Bản đồ
                </button>
              </div>

              <button 
                onClick={clearTrip}
                className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-red-500 transition-all airy-shadow"
              >
                Xoá hết
              </button>
              <button 
                onClick={handleSync}
                disabled={loading}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Send className="w-3 h-3" />}
                Lưu hành trình
              </button>
          </div>
        </div>

        {tripItems.length === 0 ? (
          <div className="text-center py-40 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-50 dark:border-slate-800 airy-shadow">
               <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                  <MapPin className="w-10 h-10 text-slate-200" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Chưa có điểm đến nào</h2>
               <p className="text-slate-400 font-medium max-w-xs mx-auto text-lg leading-relaxed mb-10">
                 Hãy bắt đầu chọn những địa điểm bạn yêu thích để lên kế hoạch.
               </p>
               <button 
                onClick={() => navigate('/recommend')}
                className="px-10 py-5 bg-primary-600 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary-500/30"
               >
                 Khám phá ngay
               </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* List Side */}
            <div className={cn("space-y-8 relative", viewMode === 'list' ? "lg:col-span-12 xl:col-span-7" : "hidden lg:block lg:col-span-5")}>
               <div className="absolute left-10 md:left-24 top-10 bottom-10 w-0.5 bg-slate-100 dark:bg-slate-800 hidden sm:block" />

               {tripItems.map((item, idx) => (
                 <div 
                    key={item.location_id} 
                    className="flex flex-col sm:flex-row items-center gap-8 group"
                 >
                    {/* Step Indicator */}
                    <div className="w-20 h-20 md:w-48 flex flex-col items-center justify-center relative z-10 shrink-0">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Chặng {idx + 1}</span>
                       <div className="w-16 h-16 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-primary-500 flex items-center justify-center text-2xl font-black text-slate-900 dark:text-white shadow-xl group-hover:scale-110 transition-transform">
                          {idx + 1}
                       </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-[3rem] p-6 pr-8 airy-shadow flex items-center gap-6 border border-slate-50 dark:border-slate-800 hover:border-primary-100 transition-all">
                       <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden shrink-0">
                          <img src={item.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 truncate">{item.name}</h3>
                          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-primary-500" />
                                <span>~2 giờ</span>
                             </div>
                             <button
                                onClick={() => navigate(`/detail/${item.location_id}`)}
                                className="text-primary-600 hover:underline"
                             >
                                Chi tiết
                             </button>
                          </div>
                       </div>
                       
                       {/* Controls */}
                       <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 transition-all disabled:opacity-20"
                          >
                             <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === tripItems.length - 1}
                            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 transition-all disabled:opacity-20"
                          >
                             <ChevronDown className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeItem(item.location_id)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {/* Map Side */}
            <div className={cn("h-[600px] lg:h-[800px] sticky top-32", 
                viewMode === 'map' ? "lg:col-span-12" : "lg:col-span-12 xl:col-span-5")}>
                <MapView 
                    locations={gpsCoords ? [
                        { 
                            location_id: 0, 
                            name: 'Vị trí của bạn', 
                            latitude: gpsCoords.lat, 
                            longitude: gpsCoords.lng,
                            address: 'Vị trí hiện tại',
                            description: 'Điểm khởi đầu của bạn'
                        } as any, 
                        ...fullLocations
                    ] : fullLocations}
                    route={route}
                    showOrder={true}
                />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
