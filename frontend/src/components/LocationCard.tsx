import { Star, MapPin, Heart, Cloud, Sun, CloudRain, CloudLightning, Tag } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Location } from '../types';
import { useEffect, useState } from 'react';
import { getWeatherForLocation, WeatherData } from '../api/weatherService';

interface LocationCardProps {
  location: Location;
  userLat?: number;
  userLng?: number;
  onClick?: () => void;
  className?: string; // Allow custom classes
}

export default function LocationCard({ location, userLat, userLng, onClick, className }: LocationCardProps) {
  // Simple distance mock or calculation
  const distance = userLat && userLng
    ? ((Math.sqrt(Math.pow(location.latitude - userLat, 2) + Math.pow(location.longitude - userLng, 2)) * 111).toFixed(1))
    : null;

  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    getWeatherForLocation(location.latitude, location.longitude).then(setWeather);
  }, [location.latitude, location.longitude]);

  // Icon map for weather
  const WeatherIcon = ({ icon }: { icon: string }) => {
    if (icon === 'cloud') return <Cloud className="w-3 h-3" />;
    if (icon === 'cloud-rain') return <CloudRain className="w-3 h-3" />;
    if (icon === 'cloud-lightning') return <CloudLightning className="w-3 h-3" />;
    return <Sun className="w-3 h-3" />;
  };

  return (
    <div
      className={cn(
        "group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full",
        className
      )}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={location.image || 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07'}
          alt={location.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Button */}
        <button
          className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors"
          onClick={(e) => { e.stopPropagation(); /* Add favorite logic */ }}
        >
          <Heart className="w-5 h-5" />
        </button>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/20">
            {location.category || 'Du lịch'}
          </div>

          {/* Match Score Badge */}
          {location.matchScore && (
            <div className="px-3 py-1 bg-green-500/90 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg animate-fade-in">
              {location.matchScore}% Phù hợp
            </div>
          )}

          {/* Discount Badge */}
          {location.discount && (
            <div className="flex items-center gap-1 px-3 py-1 bg-red-500/90 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg animate-bounce-slow">
              <Tag className="w-3 h-3" />
              {location.discount.content}
            </div>
          )}
        </div>

        {/* Weather Badge (Bottom Left) */}
        {weather && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 shadow-sm">
            <WeatherIcon icon={weather.icon} />
            <span>{weather.temp}°C</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {location.name}
          </h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-700">{location.rating_avg ? location.rating_avg.toFixed(1) : 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{distance ? `${distance} km từ vị trí của bạn` : 'Việt Nam'}</span>
        </div>

        <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">
          {location.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <span className="text-primary-600 font-semibold text-sm">
            {location.priceRange || 'Miễn phí'}
          </span>
          <span className="text-slate-400 text-xs">
            {location.rating_count} đánh giá
          </span>
        </div>
      </div>
    </div>
  );
}