import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, MapPin, Calendar, Settings, Heart, History, LogOut, Loader2, Camera, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../api';
import { Location, Favorite, VisitRequest } from '../types/schema';
import RatingStars from '../components/RatingStars';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Profile() {
    const { user, loginAsUser, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'favorites' | 'security'>('info');
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [visits, setVisits] = useState<VisitRequest[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone_number: user?.phone_number || '',
        birth_year: user?.birth_year || '',
        gender: (user?.gender || '') as any
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    React.useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, activeTab]);

    const fetchData = async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            if (activeTab === 'favorites') {
                const res = await api.favorite.getByUser(user.user_id);
                if (res.success) setFavorites(res.data);
            } else if (activeTab === 'history') {
                const res = await api.visit.getUserRequests(user.user_id);
                if (res.success) setVisits(res.data);
            }
            
            // Always fetch newsletter status in 'info' tab
            if (activeTab === 'info' && user.email) {
                const subRes = await api.newsletter.getStatus(user.email);
                if (subRes.success) setIsSubscribed(subRes.data);
            }
        } catch (err) {
            console.error("Fetch profile data error", err);
        } finally {
            setLoadingData(false);
        }
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Vui lòng đăng nhập</div>;
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setAvatarLoading(true);
        try {
            // 1. Upload to Cloudinary
            const uploadRes = await api.upload.image(file);
            if (uploadRes.success) {
                // 2. Update User Avatar in DB
                const avatarUrl = uploadRes.data;
                const updateRes = await api.user.updateAvatar(user.user_id, avatarUrl);
                
                if (updateRes.success) {
                    loginAsUser(updateRes.data);
                    alert("Cập nhật ảnh đại diện thành công!");
                } else {
                    alert(updateRes.message || "Không thể cập nhật ảnh đại diện.");
                }
            } else {
                alert("Lỗi upload ảnh.");
            }
        } catch (err) {
            console.error(err);
            alert("Đã xảy ra lỗi khi cập nhật ảnh đại diện.");
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.user.updateProfile(user.user_id, {
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                birth_year: formData.birth_year ? parseInt(formData.birth_year.toString()) : undefined,
                gender: formData.gender
            });
            if (res.success && res.data) {
                loginAsUser(res.data); // Update global store
                setIsEditing(false);
                alert('Cập nhật hồ sơ thành công!');
            } else {
                alert(res.message || 'Lỗi cập nhật');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        setLoading(true);
        try {
            const res = await api.user.changePassword(passwordData.old_password, passwordData.new_password);
            if (res.success) {
                alert("Đổi mật khẩu thành công!");
                setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
            } else {
                alert(res.message || "Lỗi khi đổi mật khẩu");
            }
        } catch (err) {
            alert("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    Hồ sơ của bạn
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="glass p-6 rounded-2xl text-center">
                            <div className="relative inline-block group/avatar">
                                <div className="relative">
                                    <img
                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=random`}
                                        alt={user.full_name}
                                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto object-cover"
                                    />
                                    {avatarLoading && (
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full border-2 border-white text-white cursor-pointer hover:bg-primary-700 transition-all shadow-md active:scale-95">
                                    <Camera className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={avatarLoading} />
                                </label>
                                <span className="absolute top-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></span>
                            </div>
                            <h2 className="mt-4 font-bold text-lg text-slate-900 dark:text-white">{user.full_name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
                            {user.last_avatar_update && (
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Cập nhật gần nhất: {new Date(user.last_avatar_update).toLocaleDateString()}
                                </p>
                            )}
                        </div>

                        <nav className="glass rounded-2xl overflow-hidden p-2">
                            {[
                                { id: 'info', label: 'Thông tin cá nhân', icon: <User className="w-4 h-4" /> },
                                { id: 'history', label: 'Lịch sử đặt chỗ', icon: <History className="w-4 h-4" /> },
                                { id: 'favorites', label: 'Yêu thích', icon: <Heart className="w-4 h-4" /> },
                                { id: 'security', label: 'Đổi mật khẩu', icon: <Lock className="w-4 h-4" /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1",
                                        activeTab === item.id
                                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium text-sm">
                                <LogOut className="w-4 h-4" />
                                Đăng xuất
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-3">
                        <div className="glass p-8 rounded-2xl min-h-[400px]">
                            {activeTab === 'info' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                            <User className="w-5 h-5 text-primary-600" />
                                            Thông tin tài khoản
                                        </h3>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">Chỉnh sửa</button>
                                        ) : (
                                            <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">Hủy</button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Họ và tên</label>
                                            <input
                                                type="text"
                                                value={isEditing ? formData.full_name : user.full_name}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-70 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Số điện thoại</label>
                                            <input
                                                type="text"
                                                value={isEditing ? formData.phone_number : (user.phone_number || 'Chưa cập nhật')}
                                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-70 text-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Năm sinh</label>
                                            <input
                                                type="number"
                                                value={isEditing ? formData.birth_year : (user.birth_year || 'Chưa cập nhật')}
                                                onChange={e => setFormData({ ...formData, birth_year: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-70 text-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Giới tính</label>
                                            <select
                                                value={isEditing ? formData.gender : (user.gender || '')}
                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-70 text-slate-900 dark:text-white appearance-none"
                                            >
                                                <option value="">Chưa chọn</option>
                                                <option value="MALE">Nam</option>
                                                <option value="FEMALE">Nữ</option>
                                                <option value="OTHER">Khác</option>
                                            </select>
                                        </div>


                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sở thích du lịch</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {user.interests && user.interests.length > 0 ? (
                                                    user.interests.map((interest: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                                                            {interest}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-slate-400">Chưa có thông tin sở thích</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ngày tham gia</label>
                                            <div className="w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-2 cursor-not-allowed">
                                                <Calendar className="w-4 h-4" />
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Đăng ký nhận tin</h4>
                                            <p className="text-xs text-slate-500 mb-4">
                                                {isSubscribed 
                                                    ? "Bạn đang đăng ký nhận các tin tức và gợi ý du lịch mới nhất qua email." 
                                                    : "Bạn chưa đăng ký nhận tin tức từ chúng tôi."}
                                            </p>
                                            <button 
                                                onClick={async () => {
                                                    if (isSubscribed) {
                                                        if (confirm("Bạn có chắc chắn muốn hủy đăng ký nhận tin?")) {
                                                            const res = await api.newsletter.unsubscribe(user.email);
                                                            if (res.success) {
                                                                setIsSubscribed(false);
                                                                alert("Đã hủy đăng ký nhận tin thành công.");
                                                            }
                                                        }
                                                    } else {
                                                        const res = await api.newsletter.subscribe(user.email);
                                                        if (res.success) {
                                                            setIsSubscribed(true);
                                                            alert("Đăng ký nhận tin thành công!");
                                                        }
                                                    }
                                                }}
                                                className={cn(
                                                    "text-xs font-bold transition underline underline-offset-4",
                                                    isSubscribed ? "text-red-500 hover:text-red-600" : "text-primary-500 hover:text-primary-600"
                                                )}
                                            >
                                                {isSubscribed ? "Hủy đăng ký nhận tin (Unsubscribe)" : "Đăng ký nhận tin du lịch ngay"}
                                            </button>
                                        </div>

                                    </div>

                                    {isEditing && (
                                        <div className="pt-6 flex justify-end">
                                            <button
                                                onClick={handleSave}
                                                disabled={loading}
                                                className="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center font-medium min-w-[140px]"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu thay đổi'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
                                        <History className="w-5 h-5 text-primary-600" />
                                        Lịch sử Đăng ký Tham quan
                                    </h3>
                                    {loadingData ? (
                                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
                                    ) : visits.length === 0 ? (
                                        <div className="text-center py-12">
                                            <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">Bạn chưa có yêu cầu tham quan nào.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {visits.map(v => (
                                                <div key={v.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <img 
                                                                src={v.location?.thumbnail_url || 'https://via.placeholder.com/100'} 
                                                                alt={v.location?.name || 'Location'}
                                                                className="w-16 h-16 rounded-xl object-cover"
                                                            />
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white">{v.location?.name || 'Địa điểm'}</h4>
                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Ngày đi: {new Date(v.visit_date).toLocaleDateString('vi-VN')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                                v.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                                v.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                                                                v.status === 'COMPLETED' ? "bg-blue-100 text-blue-700" :
                                                                "bg-yellow-100 text-yellow-700"
                                                            )}>
                                                                {v.status === 'APPROVED' ? 'Đã duyệt' : v.status === 'REJECTED' ? 'Từ chối' : v.status === 'COMPLETED' ? 'Đã đi' : 'Chờ duyệt'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'favorites' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
                                        <Heart className="w-5 h-5 text-red-500" />
                                        Địa điểm đã lưu
                                    </h3>
                                    {loadingData ? (
                                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
                                    ) : favorites.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">Bạn chưa lưu địa điểm nào.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {favorites.map(f => {
                                                const loc = (f as any).location;
                                                const id = loc?.location_id || loc?.locationId || (f as any).locationId;
                                                return (
                                                    <div 
                                                        key={f.id} 
                                                        onClick={() => navigate(`/detail/${id}`)}
                                                        className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                                                    >
                                                        <div className="h-32 overflow-hidden">
                                                            <img 
                                                                src={loc?.thumbnail_url || loc?.thumbnailUrl} 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                            />
                                                        </div>
                                                        <div className="p-4">
                                                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{loc?.name}</h4>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <RatingStars rating={loc?.average_rating || loc?.averageRating || 0} size={12} />
                                                                <span className="text-[10px] text-slate-500">({loc?.total_reviews || loc?.totalReviews || 0})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
                                        <Lock className="w-5 h-5 text-primary-600" />
                                        Thay đổi mật khẩu
                                    </h3>
                                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Mật khẩu hiện tại</label>
                                            <input 
                                                type="password" 
                                                required
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" 
                                                value={passwordData.old_password}
                                                onChange={e => setPasswordData({...passwordData, old_password: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Mật khẩu mới</label>
                                            <input 
                                                type="password" 
                                                required
                                                minLength={6}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" 
                                                value={passwordData.new_password}
                                                onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Xác nhận mật khẩu mới</label>
                                            <input 
                                                type="password" 
                                                required
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" 
                                                value={passwordData.confirm_password}
                                                onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cập nhật mật khẩu"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
