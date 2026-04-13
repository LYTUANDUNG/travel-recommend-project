import { useState, useEffect } from 'react';
import { Star, Image as ImageIcon, Send } from 'lucide-react';
import { cn } from '../utils/cn';
import RatingStars from './RatingStars';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { Review } from '../types/schema';

export default function ReviewSection({ locationId }: { locationId: number }) {
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
        // Fetch Reviews
        setLoadingReviews(true);
        api.review.getByLocation(locationId).then(res => {
            if (res.success) {
                setReviews(res.data);
            }
        }).finally(() => setLoadingReviews(false));

        // Check if user has an APPROVED VisitRequest to allow reviewing
        if (isAuthenticated && user) {
            api.visit.canUserReview(user.user_id, locationId).then(res => {
                if (res.success) {
                    setCanReview(res.data);
                }
            });
        } else {
            setCanReview(false);
        }
    }, [locationId, isAuthenticated, user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const res = await api.upload.image(file);
            if (res.success) {
                setImages(prev => [...prev, res.data]);
            } else {
                alert(res.message || "Upload failed");
            }
        } catch (err) {
            alert("Lỗi khi upload ảnh");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating || !isAuthenticated || !user) return;

        setSubmitLoading(true);
        const payload: Partial<Review> = {
            user_id: user.user_id,
            location_id: locationId,
            rating,
            comment,
            images_json: images,
            visit_date: new Date().toISOString().split('T')[0]
        };

        try {
            const res = editingReview 
                ? await (api.review as any).updateReview(editingReview.review_id, payload)
                : await api.review.addReview(payload);
            
            if (res.success) {
                if (editingReview) {
                    setReviews(reviews.map(r => r.review_id === res.data.review_id ? res.data : r));
                    setEditingReview(null);
                } else {
                    setReviews([res.data, ...reviews]);
                }
                setComment('');
                setRating(0);
                setImages([]);
            } else {
                alert(res.message || "Không thể gửi review.");
            }
        } catch (err) {
            alert("Đã xảy ra lỗi.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const startEdit = (review: Review) => {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment || '');
        setImages(review.images_json || []);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingReview(null);
        setRating(0);
        setComment('');
        setImages([]);
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8">Đánh giá & Bình luận ({reviews.length})</h2>

            {/* Review Form */}
            {(canReview || editingReview) ? (
                <div className="mb-10 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border-l-4 border-primary-500">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">
                        {editingReview ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá của bạn"}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Bạn chấm điểm địa điểm này thế nào?</label>
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
                                                rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
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
                                className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] text-slate-900 dark:text-slate-100"
                                placeholder="Chia sẻ trải nghiệm của bạn..."
                                required
                            />
                        </div>

                        {images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {images.map((url, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={url} className="w-20 h-20 object-cover rounded-lg border dark:border-slate-700" alt="upload" />
                                        <button 
                                            type="button"
                                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Star className="w-3 h-3 rotate-45" /> {/* Use X icon if available, but Star rotated looks like X */}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-700">
                                    <ImageIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                </label>
                                {editingReview && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="text-sm text-slate-500 hover:text-red-500"
                                    >
                                        Hủy bỏ
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!rating || !comment || submitLoading}
                                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {submitLoading ? 'Đang gửi...' : editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mb-10 p-6 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200 text-center">
                    {!isAuthenticated ? (
                        <>Bạn cần <strong>Đăng nhập</strong> và <strong>Đăng ký tham quan</strong> địa điểm này trước khi được phép đánh giá.</>
                    ) : (
                        <>Bạn chưa thể đánh giá địa điểm này. Vui lòng bấm <strong>"Thêm vào lịch trình / Đặt chỗ"</strong> và đợi quản trị viên duyệt trước khi đánh giá!</>
                    )}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-8">
                {loadingReviews ? (
                    <div className="text-center text-slate-500 py-4">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center text-slate-500 py-4">Chưa có đánh giá nào cho địa điểm này.</div>
                ) : (
                    reviews.map((review: any) => (
                        <div key={review.review_id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-8 last:pb-0">
                            <div className="flex items-start gap-4">
                                <img src={review.user_avatar || `https://ui-avatars.com/api/?name=${review.user_name || 'Guest'}&background=random`} alt={review.user_name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-900 dark:text-slate-200">{review.user_name || 'Anonymous'}</h4>
                                        <span className="text-sm text-slate-400">
                                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Gần đây'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-3">
                                        <RatingStars rating={review.rating} size={16} />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                        {review.comment}
                                    </p>

                                    {/* Defensive check for images array */}
                                    {(review.images_json || review.images) && (Array.isArray(review.images_json || review.images)) && (review.images_json || review.images).length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(review.images_json || review.images).map((img: string, i: number) => (
                                                <img key={i} src={img} alt="review" className="w-24 h-24 object-cover rounded-lg border dark:border-slate-800" />
                                            ))}
                                        </div>
                                    )}

                                    {isAuthenticated && user?.user_id === review.user_id && !review.is_edited && (
                                        <button 
                                            onClick={() => startEdit(review)}
                                            className="text-sm text-primary-600 font-medium hover:underline"
                                        >
                                            Chỉnh sửa
                                        </button>
                                    )}
                                    {review.is_edited && (
                                        <span className="text-xs text-slate-400 italic">(Đã chỉnh sửa)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
