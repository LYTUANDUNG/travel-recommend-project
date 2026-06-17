import { useState } from 'react';
import { Star, Clock, Sparkles, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Location } from '../types/schema';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';
import { humanizeDistance, humanizeMatch, formatOneDecimalFloor } from '../utils/humanize';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { encodeId } from '../utils/obfuscate';

interface Props {
  location: Location;
  userLat?: number;
  userLng?: number;
  className?: string; // Allow custom classes like 'ring-4'
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hideMatchBadge?: boolean;
}

export default function LocationCard({ location, className, onClick, userLat, userLng, onMouseEnter, onMouseLeave, hideMatchBadge }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const isFavorited = useFavoriteStore(state => state.isFavorited(location.location_id));
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();

  const handleCardClick = () => {
    // Log behavior (Academic data gathering)
    if (isAuthenticated && user) {
        api.behavior.logAction({
            user_id: user.user_id,
            location_id: location.location_id,
            action: 'VIEW_DETAILS'
        }).catch(() => {});
    }
    
    navigate(`/location/${encodeId(location.location_id)}`, { state: { matchScore: location.match_score } });
    if (onClick) onClick();
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    if (!isAuthenticated || !user) {
      alert("Vui lòng đăng nhập để lưu địa điểm!");
      return;
    }

    const isFav = await useFavoriteStore.getState().toggleFavorite(user.user_id, location.location_id);
    if (isFav) {
      api.behavior.logAction({
        user_id: user.user_id,
        location_id: location.location_id,
        action: 'ADD_FAVORITE'
      }).catch(() => {});
    }
  };

  // Format Price: e.g. 2 -> "$$"
  const pLevel = Math.max(0, Math.min(5, location.price_level || 1));
  const priceDisplay = '$'.repeat(pLevel);

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "premium-card card-hover flex flex-col h-full cursor-pointer relative overflow-hidden group",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden rounded-t-2xl shrink-0 isolate">
        <img
          src={location.thumbnail_url || (location.images && location.images[0]) || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2568&auto=format&fit=crop'}
          alt={location.name}
          className="w-full h-full object-cover rounded-t-2xl transform group-hover:scale-110 transition-transform duration-550 ease-out"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Favorite Button */}
        <button 
          onClick={handleToggleFavorite}
          className={cn(
            "absolute top-3 right-3 p-2 bg-black/25 hover:bg-white backdrop-blur-md rounded-full text-white hover:text-red-500 transition-all hover:scale-110 z-10 shadow-sm border border-white/10",
            isFavorited && "bg-red-500 text-white border-red-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>

        {/* Humanized Match Badge */}
        {!hideMatchBadge && (() => {
          const match = humanizeMatch(location.match_score);
          if (match.level === 'high' || match.level === 'medium') {
            return (
              <div className={cn(
                "absolute top-3 left-3 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md z-10 border backdrop-blur-md text-[9px] font-black uppercase tracking-widest",
                match.level === 'high' ? "bg-orange-500/90 border-orange-400/30 text-white" : "bg-white/90 border-slate-100 text-slate-800"
              )}>
                <span>{Math.round((location.match_score || 0) * 100)}% khớp</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Category Tag on Image */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 bg-orange-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-md border border-orange-400/35">
            {location.category_name || 'Khám phá'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-black text-base text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors line-clamp-1 mb-2.5">
            {location.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800 dark:text-white">{formatOneDecimalFloor(location.average_rating)}</span>
              <span className="text-slate-400 text-[10px]">({location.total_reviews})</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>{humanizeDistance(userLat, userLng, location.latitude, location.longitude)}</span>
            </div>
          </div>
        </div>

        {/* Time Info (Safe) */}
        {location.opening_hour && location.closing_hour && (
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Giờ hoạt động</span>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-slate-500">{String(location.opening_hour).slice(0, 5)} - {String(location.closing_hour).slice(0, 5)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}