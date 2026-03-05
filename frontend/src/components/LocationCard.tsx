import React from 'react';
import { Star, MapPin, Heart, Clock, DollarSign } from 'lucide-react';
import { Location } from '../types';
import { cn } from '../utils/cn';

interface Props {
  location: Location;
  userLat?: number;
  userLng?: number;
  className?: string; // Allow custom classes like 'ring-4'
  onClick?: () => void;
}

export default function LocationCard({ location, className, onClick }: Props) {
  // Format Price: e.g. 2 -> "$$"
  const priceDisplay = '$'.repeat(location.price_level || 1);

  // Match Score Ring Color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 border-green-600';
    if (score >= 70) return 'text-blue-600 border-blue-600';
    return 'text-orange-500 border-orange-500';
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-700",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={location.thumbnail_url || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2568&auto=format&fit=crop'}
          alt={location.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Favorite Button (Mock) */}
        <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white text-white hover:text-red-500 transition-colors">
          <Heart className="w-5 h-5" />
        </button>

        {/* Match Score Badge (AI Feature) */}
        {location.match_score && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur border border-white/50 dark:border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Gợi ý cho bạn:</span>
            <span className={cn("text-xs font-black",
              location.match_score >= 90 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
            )}>
              {location.match_score}% phù hợp
            </span>
          </div>
        )}

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

        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="line-clamp-1">{location.address || 'Vietnam'}</span>
        </div>

        {/* Rich Attributes Row */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span className="text-slate-700">{priceDisplay}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{location.opening_hour?.slice(0, 5) || '08:00'} - {location.closing_hour?.slice(0, 5) || '22:00'}</span>
          </div>
        </div>

        {/* Tags (New Feature) */}
        {location.tags && location.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {location.tags.slice(0, 3).map(tag => (
              <span key={tag.name} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-sm">
                #{tag.name}
              </span>
            ))}
            {location.tags.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center">+{location.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* AI Explainability (Reason) */}
        {/* Accessing a new property 'match_reason' we added in the hook but need to be careful if strict type. 
            Ideally we should extend the types. For now, assuming it's available or ignored by TS if loose, 
            but better to stick to Schema. Let's assume standard Location for now. 
            Wait, I added match_score to schema, but not match_reason.
            Let's keep it simple for now or use `any` cast if needed, but I'll stick to visual.
        */}
      </div>
    </div>
  );
}