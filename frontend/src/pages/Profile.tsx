import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, MapPin, Calendar, Settings, Heart, History, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Profile() {
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'favorites'>('info');

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Vui lòng đăng nhập</div>;
    }

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
                            <div className="relative inline-block">
                                <img
                                    src={user.avatar_url || 'https://via.placeholder.com/150'}
                                    alt={user.full_name}
                                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto"
                                />
                                <span className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></span>
                            </div>
                            <h2 className="mt-4 font-bold text-lg text-slate-900 dark:text-white">{user.full_name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
                        </div>

                        <nav className="glass rounded-2xl overflow-hidden p-2">
                            {[
                                { id: 'info', label: 'Thông tin cá nhân', icon: <User className="w-4 h-4" /> },
                                { id: 'history', label: 'Lịch sử đặt chỗ', icon: <History className="w-4 h-4" /> },
                                { id: 'favorites', label: 'Yêu thích', icon: <Heart className="w-4 h-4" /> },
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
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                        <User className="w-5 h-5 text-primary-600" />
                                        Thông tin tài khoản
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Họ và tên</label>
                                            <input
                                                type="text"
                                                value={user.full_name}
                                                readOnly
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 text-slate-700 dark:text-slate-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                readOnly
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ngày tham gia</label>
                                            <div className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                                            Cập nhật thông tin
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="text-center py-12">
                                    <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">Chưa có lịch sử đặt chỗ.</p>
                                </div>
                            )}

                            {activeTab === 'favorites' && (
                                <div className="text-center py-12">
                                    <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">Chưa có địa điểm yêu thích.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
