import { useState } from 'react';
import { Star, Image as ImageIcon, Send } from 'lucide-react';
import { cn } from '../utils/cn';
import RatingStars from './RatingStars'; // Ensure this exists or I'll implement it inline if simple

// Mock props for now
interface Review {
    id: number;
    userName: string;
    avatar: string;
    rating: number;
    date: string;
    comment: string;
    images?: string[];
}

export default function ReviewSection({ locationId }: { locationId: number }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    // Mock data
    const [reviews, setReviews] = useState<Review[]>([
        {
            id: 1,
            userName: 'Trần Văn Tú',
            avatar: 'https://ui-avatars.com/api/?name=Tran+Van+Tu&background=random',
            rating: 5,
            date: '2 ngày trước',
            comment: 'Địa điểm tuyệt vời, không khí trong lành. Rất đáng để trải nghiệm!',
            images: ['https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=200']
        },
        {
            id: 2,
            userName: 'Le Thi Hoa',
            avatar: 'https://ui-avatars.com/api/?name=Le+Thi+Hoa&background=random',
            rating: 4,
            date: '1 tuần trước',
            comment: 'Dịch vụ tốt, giá cả hợp lý. Tuy nhiên hơi đông vào cuối tuần.'
        }
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating) return;

        // Mock submit
        const newReview: Review = {
            id: Date.now(),
            userName: 'Bạn',
            avatar: 'https://ui-avatars.com/api/?name=You&background=random',
            rating,
            date: 'Vừa xong',
            comment,
            images: []
        };

        setReviews([newReview, ...reviews]);
        setComment('');
        setRating(0);
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-8">Đánh giá & Bình luận</h2>

            {/* Review Form */}
            <div className="mb-10 bg-slate-50 p-6 rounded-xl">
                <h3 className="font-bold text-slate-800 mb-4">Viết đánh giá của bạn</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-slate-600 mb-2">Bạn chấm điểm địa điểm này thế nào?</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8",
                                            rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-white"
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Thêm ảnh</span>
                        </button>

                        <button
                            type="submit"
                            disabled={!rating || !comment}
                            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="w-4 h-4" />
                            Gửi đánh giá
                        </button>
                    </div>
                </form>
            </div>

            {/* Reviews List */}
            <div className="space-y-8">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 last:border-0 pb-8 last:pb-0">
                        <div className="flex items-start gap-4">
                            <img src={review.avatar} alt={review.userName} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-slate-900">{review.userName}</h4>
                                    <span className="text-sm text-slate-400">{review.date}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-3">
                                    <RatingStars rating={review.rating} size={16} />
                                </div>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    {review.comment}
                                </p>
                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2">
                                        {review.images.map((img, idx) => (
                                            <img key={idx} src={img} alt="Review" className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
