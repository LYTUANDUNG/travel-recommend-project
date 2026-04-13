import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import { RecommendationResult } from '../types';
import { useRecommendations } from '../hooks/useRecommendations';
import { useAuthStore } from '../store/useAuthStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { Sparkles, MapPin, Compass, LogIn, CloudRain, Sun, Thermometer, Clock } from 'lucide-react';

export default function Recommend() {
  const { coords, error: gpsError } = useGeoLocation();
  const [weather, setWeather] = useState<{ temp: number; label: string; code: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isReady = (coords !== undefined && weather !== null) || !!gpsError;

  const { recommendations: smartRecs, loading } = useRecommendations(
    coords?.lat || 10.762622, 
    coords?.lng || 106.660172, 
    currentTime.getHours(), 
    weather?.code || 'Clear',
    isReady
  );

  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [results, setResults] = useState<RecommendationResult[]>([]);

  useEffect(() => {
    if (coords) {
       fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
            if (data.current_weather) {
                const code = data.current_weather.weathercode;
                let label = "Nắng ráo";
                let aiCode = "Clear";
                if (code >= 51) { label = "Có mưa"; aiCode = "Rainy"; }
                else if (code >= 1 && code <= 3) { label = "Nhiều mây"; aiCode = "Cloudy"; }
                else if (code >= 45 && code <= 48) { label = "Sương mù"; aiCode = "Cloudy"; }
                
                setWeather({ temp: Math.round(data.current_weather.temperature), label, code: aiCode });
            }
        }).catch(() => {
            setWeather({ temp: 28, label: 'Nắng ráo', code: 'Clear' });
        });
    } else if (gpsError) {
        setWeather({ temp: 28, label: 'Nắng ráo', code: 'Clear' });
    }
  }, [coords, gpsError]);

  useEffect(() => {
    if (smartRecs && Array.isArray(smartRecs)) {
      setResults(smartRecs.map((loc) => ({
        location: loc,
        similarity: loc?.match_score ? loc.match_score / 100 : 0
      })).filter(r => r.location));
    }
  }, [smartRecs]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20 flex flex-col items-center justify-center container mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-xl">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Khám phá hành trình riêng của bạn</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">Đăng nhập ngay để hệ thống có thể phân tích sở thích và lịch sử du lịch của bạn, từ đó gợi ý những điểm đến tuyệt vời nhất.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => navigate('/login')} className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all active:scale-95 shadow-lg">
                      <LogIn className="w-4 h-4" /> Đăng nhập ngay
                  </button>
                  <button onClick={() => navigate('/register')} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 active:scale-95 transition-all">
                      Đăng ký tài khoản
                  </button>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEFA] dark:bg-slate-950 pt-32 pb-20 relative">
      <div className="max-w-7xl mx-auto px-4">
        {/* Storytelling Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-3xl mb-4">
                <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white leading-[1.1]">
              Chào {user?.full_name}, <br/> 
              <span className="text-gradient">bạn muốn đi đâu hôm nay?</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              {results.some(r => r.similarity && r.similarity > 0.1) 
                ? "Dựa trên sở thích, thời gian và ngữ cảnh, đây là những gợi ý phù hợp dành riêng cho bạn (Sử dụng kết hợp Content-based Filtering và Collaborative Filtering)."
                : "Vì bạn chưa thích hay xem nhiều địa điểm nên tôi sẽ gợi ý những điểm đến nổi bật nhất hiện nay:"}
            </p>
        </div>

        {/* Algorithm Insights Banner (Academic Alignment) */}
        <div className="max-w-5xl mx-auto mb-24 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 airy-shadow animate-in slide-in-from-bottom-12 duration-1000">
            <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-4">Hệ thống gợi ý thông minh (Recommendation Engine)</h3>
                   <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white">Cơ chế tính điểm đề xuất</h2>
                   <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                       Chúng tôi sử dụng thuật toán <span className="font-bold text-slate-900 dark:text-white">Content-Based Filtering</span> kết hợp với <span className="font-bold text-slate-900 dark:text-white">Cosine Similarity</span> để tìm ra những địa điểm khớp nhất với hành vi của bạn.
                   </p>
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <div className="text-center group">
                        <div className="w-16 h-16 rounded-[2rem] bg-primary-50 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform airy-shadow">
                            <Compass className="w-8 h-8" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sở thích (CBF)</p>
                        <p className="text-xl font-serif font-black text-slate-900 dark:text-white">60%</p>
                    </div>
                    <div className="text-center group">
                        <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform airy-shadow">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Khoảng cách</p>
                        <p className="text-xl font-serif font-black text-slate-900 dark:text-white">30%</p>
                    </div>
                    <div className="text-center group">
                        <div className="w-16 h-16 rounded-[2rem] bg-amber-50 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform airy-shadow">
                            <Clock className="w-8 h-8" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ngữ cảnh</p>
                        <p className="text-xl font-serif font-black text-slate-900 dark:text-white">10%</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-32">
          {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Cảm hứng đang đến...</p>
              </div>
          ) : results.length > 0 ? (
            <>
              {/* Narrative Discovery Groups */}
              <div className="space-y-40">
                {/* Group 1: Trốn khỏi sự ồn ào */}
                <section className="text-reveal">
                  <div className="mb-16">
                    <h2 className="text-5xl font-serif italic text-slate-900 dark:text-white mb-4">“Trốn khỏi sự ồn ào.”</h2>
                    <p className="text-lg text-slate-500 font-medium">Những không gian tĩnh lặng dành cho tâm hồn bạn.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                    {results.slice(0, 3).map((item, idx) => (
                      <LocationCard 
                        key={`relax-${idx}`} 
                        location={item.location} 
                        userLat={coords?.lat} 
                        userLng={coords?.lng} 
                      />
                    ))}
                  </div>
                </section>

                {/* Group 2: Một ngày chậm lại */}
                <section className="bg-primary-50/30 dark:bg-primary-900/10 -mx-4 md:-mx-12 px-4 md:px-12 py-32 rounded-[5rem] text-reveal">
                  <div className="mb-16">
                    <h2 className="text-5xl font-serif italic text-slate-900 dark:text-white mb-4">“Một ngày chậm lại.”</h2>
                    <p className="text-lg text-slate-500 font-medium">Khám phá văn hóa và những góc nhỏ đầy tính nghệ thuật.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                    {results.slice(3, 6).map((item, idx) => (
                      <LocationCard 
                        key={`culture-${idx}`} 
                        location={item.location} 
                        userLat={coords?.lat} 
                        userLng={coords?.lng} 
                        className="shadow-2xl"
                      />
                    ))}
                  </div>
                </section>

                {/* Group 3: Hành trình ngẫu hứng */}
                <section className="text-reveal">
                  <div className="mb-16">
                    <h2 className="text-5xl font-serif italic text-slate-900 dark:text-white mb-4">“Hành trình ngẫu hứng.”</h2>
                    <p className="text-lg text-slate-500 font-medium">Gợi ý cho những chuyến đi ngắn ngày đầy hứng khởi.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {results.slice(6).map((item, idx) => (
                      <LocationCard 
                        key={`weekend-${idx}`} 
                        location={item.location} 
                        userLat={coords?.lat} 
                        userLng={coords?.lng} 
                      />
                    ))}
                  </div>
                </section>
              </div>

              {/* Map Preview (Subtle at bottom) */}
              <div className="mt-40 bg-slate-900 dark:bg-slate-900 rounded-[5rem] p-12 text-white">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                    <div className="max-w-md text-center md:text-left">
                      <h3 className="text-3xl font-black mb-4">Live Discovery Map</h3>
                      <p className="text-white/60 font-medium">Tất cả các điểm đến đang chờ bạn khám phá trên bản đồ trực quan.</p>
                    </div>
                  </div>
                  <div className="h-[500px] rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl">
                    <MapView locations={results.map(r => r.location)} />
                  </div>
              </div>
            </>
          ) : (
                <div className="text-center py-40 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                        <MapPin className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Đang chuẩn bị gợi ý cho bạn...</h3>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                        Hệ thống đang thu thập những điểm đến hấp dẫn nhất. Vui lòng quay lại sau giây lát hoặc thử khám phá các khu vực khác.
                    </p>
                    <button onClick={() => navigate('/explore')} className="mt-8 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold">Khám phá ngay</button>
                </div>
          )}
        </div>
      </div>
    </div>
  );
}