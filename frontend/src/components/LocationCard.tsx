import { useState, useEffect } from 'react';
import { Star, Clock, Sparkles, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Location } from '../types/schema';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';
import { humanizeDistance, humanizeMatch } from '../utils/humanize';

interface Props {
  location: Location;
  userLat?: number;
  userLng?: number;
  className?: string; // Allow custom classes like 'ring-4'
  onClick?: () => void;
}

export default function LocationCard({ location, className, onClick, userLat, userLng }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();

  const handleCardClick = () => {
    // Log behavior (Academic data gathering)
    if (isAuthenticated && user) {
        api.client.post('/behavior/log', {
            userId: user.user_id,
            locationId: location.location_id,
            action: 'CLICK'
        }).catch(() => {});
    }
    
    navigate(`/detail/${location.location_id}`, { state: { matchScore: location.match_score } });
    if (onClick) onClick();
  };

  // Check initial favorite status
  useEffect(() => {
    if (isAuthenticated && user) {
        api.favorite.getByUser(user.user_id).then(res => {
            if (res.success) {
                const isFav = res.data.some((f: any) => {
                    const locId = f.location?.location_id || f.location?.locationId || f.locationId;
                    return locId === (location.location_id || (location as any).locationId);
                });
                setIsFavorited(isFav);
            }
        });
    }
  }, [isAuthenticated, user, location.location_id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    if (!isAuthenticated || !user) {
      alert("Vui lòng đăng nhập để lưu địa điểm!");
      return;
    }

    const res = await api.favorite.toggle(user.user_id, location.location_id);
    if (res.success) {
      setIsFavorited(res.data);
    }
  };

  // Format Price: e.g. 2 -> "$$"
  const pLevel = Math.max(0, Math.min(5, location.price_level || 1));
  const priceDisplay = '$'.repeat(pLevel);

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-800",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={location.thumbnail_url || (location.images && location.images[0]) || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2568&auto=format&fit=crop'}
          alt={location.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Favorite Button */}
        <button 
          onClick={handleToggleFavorite}
          className={cn(
            "absolute top-3 right-3 p-2 backdrop-blur-md rounded-full transition-all hover:scale-110 z-10",
            isFavorited 
              ? "bg-red-500 text-white" 
              : "bg-white/20 text-white hover:bg-white hover:text-red-500"
          )}
        >
          <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
        </button>

        {/* Humanized Match Badge (Tinh tế, không sến) */}
        {(() => {
          const match = humanizeMatch(location.match_score);
          if (match.level === 'high' || match.level === 'medium') {
            return (
              <div className={cn(
                "absolute top-4 left-4 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10",
                match.level === 'high' ? "bg-primary-600 text-white" : "bg-white text-slate-800"
              )}>
                <span className="font-bold text-[10px] uppercase tracking-wider">{Math.round((location.match_score || 0) * 100)}% Phù hợp</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">{match.text}</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Category Tag on Image */}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1 bg-primary-600/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-lg">
            {location.category_name || 'Khám phá'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
            {location.name}
          </h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-700">{location.average_rating || 0}</span>
            <span className="text-xs text-slate-400">({location.total_reviews})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
          <Clock className="w-3.5 h-3.5 text-primary-500" />
          <span>{humanizeDistance(userLat, userLng, location.latitude, location.longitude)}</span>
        </div>

        {/* Time Info (Safe) */}
        {location.opening_hour && location.closing_hour && (
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
              <div className="flex items-center gap-1 ml-auto">
                 <span>{String(location.opening_hour).slice(0, 5)} - {String(location.closing_hour).slice(0, 5)}</span>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}