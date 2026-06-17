import { useEffect, useState } from 'react';
import { Image as ImageIcon, Send, Star, X } from 'lucide-react';
import RatingStars from './RatingStars';
import { Surface, inputClassName, primaryButtonClassName, secondaryButtonClassName } from './ui/AppPage';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { Review } from '../types/schema';
import { cn } from '../utils/cn';

export default function ReviewSection({ locationId, compact = false, onReviewSuccess }: { locationId: number; compact?: boolean; onReviewSuccess?: () => void }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [canReview, setCanReview] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        setLoadingReviews(true);
        api.review.getByLocation(locationId)
            .then(res => {
                if (res.success) setReviews(res.data || []);
            })
            .finally(() => setLoadingReviews(false));

        if (isAuthenticated && user) {
            api.visit.canUserReview(user.user_id, locationId).then(res => {
                if (res.success) setCanReview(res.data);
            });
        } else {
            setCanReview(false);
        }
    }, [locationId, isAuthenticated, user]);

    const resetForm = () => {
        setEditingReview(null);
        setRating(0);
        setComment('');
        setImages([]);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const res = await api.upload.image(file);
            if (res.success) setImages(prev => [...prev, res.data]);
            else alert(res.message || 'Không thể tải ảnh.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!rating || !comment || !isAuthenticated || !user) return;

        setSubmitLoading(true);
        const payload: Partial<Review> = {
            user_id: user.user_id,
            location_id: locationId,
            rating,
            comment,
            images_json: images,
            visit_date: new Date().toISOString().slice(0, 10)
        };

        try {
            const res = editingReview
                ? await (api.review as any).updateReview(editingReview.review_id, payload)
                : await api.review.addReview(payload);

            if (res.success) {
                if (editingReview) {
                    setReviews(prev => prev.map(item => item.review_id === res.data.review_id ? res.data : item));
                } else {
                    setReviews(prev => [res.data, ...prev]);
                    onReviewSuccess?.();
                }
                resetForm();
            } else {
                alert(res.message || 'Không thể gửi đánh giá.');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const startEdit = (review: Review) => {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment || '');
        setImages(review.images_json || []);
    };

    return (
        <Surface className={cn(compact ? "p-6 md:p-8" : "p-8")}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Cộng đồng</p>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Đánh giá ({reviews.length})</h2>
                </div>
            </div>

            {(canReview || editingReview) ? (
                <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {editingReview ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá của bạn'}
                    </h3>

                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                                <Star className={cn("w-7 h-7", rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700")} />
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        className={cn(inputClassName, "min-h-[110px] resize-none")}
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        required
                    />

                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {images.map((url, index) => (
                                <div key={url} className="relative">
                                    <img src={url} className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-800" alt="Ảnh đánh giá" />
                                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <label className={secondaryButtonClassName}>
                                <ImageIcon className="w-4 h-4" />
                                {uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                            {editingReview && (
                                <button type="button" onClick={resetForm} className={secondaryButtonClassName}>
                                    Hủy
                                </button>
                            )}
                        </div>

                        <button type="submit" disabled={!rating || !comment || submitLoading} className={primaryButtonClassName}>
                            <Send className="w-4 h-4" />
                            {submitLoading ? 'Đang gửi...' : editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mb-8 p-5 rounded-2xl bg-orange-50 border border-orange-100 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/40 dark:text-orange-200 text-sm text-center">
                    {!isAuthenticated
                        ? 'Đăng nhập và đăng ký tham quan trước khi đánh giá địa điểm này.'
                        : 'Bạn cần có lượt tham quan được duyệt trước khi viết đánh giá.'}
                </div>
            )}

            <div className="space-y-4">
                {loadingReviews ? (
                    [1, 2, 3].map(item => (
                        <div key={item} className="flex gap-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    ))
                ) : reviews.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">Chưa có đánh giá nào cho địa điểm này.</div>
                ) : (
                    reviews.map((review: any) => {
                        const reviewImages = review.images_json || review.images || [];
                        return (
                            <div key={review.review_id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                                <div className="flex items-start gap-4">
                                    <img
                                        src={review.user_avatar || `https://ui-avatars.com/api/?name=${review.user_name || 'User'}&background=random`}
                                        alt={review.user_name || 'User'}
                                        className="w-11 h-11 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <h4 className="font-black text-sm text-slate-900 dark:text-white">{review.user_name || 'Người dùng'}</h4>
                                                <RatingStars rating={review.rating} size={14} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                                {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : 'Gần đây'}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-6">{review.comment}</p>

                                        {Array.isArray(reviewImages) && reviewImages.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {reviewImages.map((image: string, index: number) => (
                                                    <img key={index} src={image} alt="Ảnh đánh giá" className="w-20 h-20 object-cover rounded-xl border border-slate-100 dark:border-slate-800" />
                                                ))}
                                            </div>
                                        )}

                                        {isAuthenticated && user?.user_id === review.user_id && !review.is_edited && (
                                            <button onClick={() => startEdit(review)} className="mt-3 text-xs font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">
                                                Chỉnh sửa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Surface>
    );
}
