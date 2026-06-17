import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import { RecommendationResult } from '../types';
import { useAiCollaborativeRecommendations } from '../hooks/useRecommendations';
import { useAuthStore } from '../store/useAuthStore';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { api } from '../api';
import { 
    Sparkles, 
    Compass, 
    LogIn, 
    Loader2, 
    ChevronRight, 
    ChevronLeft, 
    Brain,
    Percent,
    Sliders,
    BadgeAlert
} from 'lucide-react';
import { cn } from '../utils/cn';

function SectionCarousel({ title, subtitle, items, coords }: { title: string, subtitle: string, items: RecommendationResult[], coords: any }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (items.length === 0) return null;

    return (
        <section className="relative group">
            <div className="flex items-end justify-between mb-6 px-1">
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-1">{title}</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{subtitle}</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <button onClick={() => scroll('left')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition shadow-sm">
                        <ChevronLeft className="w-4 h-4 text-slate-550 dark:text-slate-350" />
                    </button>
                    <button onClick={() => scroll('right')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition shadow-sm">
                        <ChevronRight className="w-4 h-4 text-slate-550 dark:text-slate-350" />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, idx) => (
                    <div key={idx} className="min-w-[280px] md:min-w-[340px] snap-start relative">
                        {item.similarity > 0 && (
                          <div className="absolute top-4 right-4 z-30 bg-orange-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <Percent className="w-2.5 h-2.5" />
                            <span>Phù hợp {(item.similarity * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        <LocationCard 
                            location={item.location} 
                            userLat={coords?.lat}
                            userLng={coords?.lng}
                            className="h-full"
                            hideMatchBadge={true}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

const toSimilarity = (score: unknown) => {
  const numeric = Number(score);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
};

const buildRankedResults = (locations: any[], fallbackTopScore: number): RecommendationResult[] => {
  const rawScores = locations.map((loc) => toSimilarity(loc.match_score));
  const positiveScores = rawScores.filter((score) => score > 0);
  const maxScore = positiveScores.length ? Math.max(...positiveScores) : 0;
  const minScore = positiveScores.length ? Math.min(...positiveScores) : 0;
  const useRankSpread = positiveScores.length === 0 || maxScore - minScore < 0.03;

  return locations
    .map((loc, index) => ({
      location: loc,
      similarity: useRankSpread
        ? Math.max(0.58, fallbackTopScore - index * 0.04)
        : Math.min(0.95, Math.max(0.5, 0.55 + ((rawScores[index] - minScore) / (maxScore - minScore)) * 0.4))
    }))
    .filter((result) => result.location && result.similarity >= 0.5);
};

export default function AiRecommend() {
  const { coords } = useGeoLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { favorites, fetchFavorites } = useFavoriteStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      fetchFavorites(user.user_id);
    }
  }, [isAuthenticated, user?.user_id, fetchFavorites]);

  const { recommendations: collaborativeRecs, loading: collabLoading } = useAiCollaborativeRecommendations(user?.user_id, isAuthenticated);

  const collaborativeResults = useMemo(() => {
    if (!collaborativeRecs || !Array.isArray(collaborativeRecs)) return [];
    return buildRankedResults(collaborativeRecs, 0.9);
  }, [collaborativeRecs]);

  const isLoading = collabLoading;
  const activeResults = collaborativeResults;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 font-sans">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] shadow-xl border border-slate-200/60 dark:border-slate-800 text-center max-w-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Compass className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-855 dark:text-white mb-4">Gợi ý hành trình cá nhân hóa</h2>
              <p className="text-sm text-slate-450 dark:text-slate-400 mb-8 font-semibold leading-relaxed max-w-lg mx-auto">
                Đăng nhập để trợ lý AI VinaTravel phân tích sở thích cá nhân, khẩu vị du lịch của bạn và đưa ra các đề xuất điểm đến, ăn uống, nghỉ dưỡng tối ưu nhất.
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
      {/* Page Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 h-[280px] flex items-center p-8 md:p-12 shadow-xl">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-50"
            alt="Beach background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" /> Trợ lý thông minh
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
            Khám phá với <span className="text-orange-500">Gợi ý cho bạn.</span>
          </h1>
          <p className="text-sm text-slate-350 font-semibold leading-relaxed max-w-xl">
            Phân tích thói quen du lịch của bạn và đề xuất những địa điểm thích hợp nhất.
          </p>
        </div>
      </div>


      {/* Main Content Pane */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-100 dark:border-orange-950/20 rounded-full animate-ping" />
              <Loader2 className="absolute top-4 left-4 w-8 h-8 animate-spin text-orange-500" />
            </div>
            <p className="mt-6 text-slate-500 dark:text-slate-400 font-bold text-sm">Hệ thống đang chuẩn bị danh sách gợi ý...</p>
          </div>
        ) : activeResults.length > 0 ? (
          <div className="space-y-12">
            <SectionCarousel
              title="Danh sách gợi ý phù hợp nhất"
              subtitle="Một danh sách duy nhất, đã xếp hạng theo dữ liệu cá nhân hóa và mức độ tương đồng"
              items={activeResults}
              coords={coords}
            />
            {false && (
            <div className="space-y-10">
              {(() => {
                const foodEating = activeResults.filter(r => 
                  [1, 2].includes(r.location.category_id || 0) || ['Quán ăn', 'Nhà hàng', 'Cà phê', 'Bánh'].some(kw => (r.location.name || '').includes(kw))
                );
                const traveling = activeResults.filter(r => 
                  [3, 4].includes(r.location.category_id || 0) || ['Chùa', 'Bảo tàng', 'Di tích', 'Dinh', 'Chợ', 'Khám phá'].some(kw => (r.location.name || '').includes(kw))
                );
                const resting = activeResults.filter(r => 
                  !foodEating.some(x => x.location.location_id === r.location.location_id) && 
                  !traveling.some(x => x.location.location_id === r.location.location_id)
                );

                return (
                  <>
                    <SectionCarousel 
                      title="Ẩm thực tinh chọn"
                      subtitle="Các điểm ẩm thực sành điệu khớp khẩu vị của bạn"
                      items={foodEating.length > 0 ? foodEating : activeResults.slice(0, 5)}
                      coords={coords}
                    />

                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-sm">
                      <SectionCarousel 
                        title="Tham quan & Trải nghiệm"
                        subtitle="Khám phá di sản, văn hóa và điểm tham quan hấp dẫn nhất"
                        items={traveling.length > 0 ? traveling : activeResults.slice(5, 10)}
                        coords={coords}
                      />
                    </div>

                    {resting.length > 0 && (
                      <SectionCarousel 
                        title="Vui chơi & Giải trí khác"
                        subtitle="Các địa điểm nghỉ dưỡng, mua sắm được AI đề xuất bổ sung"
                        items={resting}
                        coords={coords}
                      />
                    )}
                  </>
                );
              })()}
            </div>
            )}

            {/* Leaflet map integration */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Bản đồ các địa điểm gợi ý</h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">Tọa độ thực tế (GIS)</span>
              </div>
              <div className="h-[450px] w-full rounded-3xl overflow-hidden relative z-0">
                <MapView locations={activeResults.map(r => r.location)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeAlert className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Chưa có gợi ý phù hợp</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mx-auto mt-2 font-semibold leading-relaxed">
              Bạn chưa có nhiều hoạt động tương tác (yêu thích, đánh giá). Hãy tiếp tục khám phá và đánh giá các địa điểm để hệ thống hiểu rõ sở thích của bạn hơn!
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-6 px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-orange-600 transition duration-300"
            >
              Khám phá địa điểm ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
