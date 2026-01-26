import { Star } from 'lucide-react';

interface Props {
  rating: number;
  size?: number;
}

export default function RatingStars({ rating, size = 16 }: Props) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
        />
      ))}
    </div>
  );
}