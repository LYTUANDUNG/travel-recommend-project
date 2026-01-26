import { useState } from 'react';
import { User, Settings, Heart, MapPin, Camera } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Profile() {
    const [activeTab, setActiveTab] = useState('info');

    const tabs = [
        { id: 'info', label: 'Thông tin cá nhân', icon: User },
        { id: 'favorites', label: 'Địa điểm yêu thích', icon: Heart },
        { id: 'trips', label: 'Lịch trình của tôi', icon: MapPin },
        { id: 'settings', label: 'Cài đặt', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-12">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-md">
                                <img src="https://ui-avatars.com/api/?name=User+Name&background=random" alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Camera className="w-8 h-8" />
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Nguyễn Văn User</h1>
                            <p className="text-slate-500 mb-4">Thành viên từ 2024 • Hà Nội, Việt Nam</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="px-4 py-2 bg-slate-50 rounded-lg text-center">
                                    <span className="block font-bold text-lg text-slate-900">12</span>
                                    <span className="text-xs text-slate-500 uppercase font-medium">Đánh giá</span>
                                </div>
                                <div className="px-4 py-2 bg-slate-50 rounded-lg text-center">
                                    <span className="block font-bold text-lg text-slate-900">5</span>
                                    <span className="text-xs text-slate-500 uppercase font-medium">Chuyến đi</span>
                                </div>
                                <div className="px-4 py-2 bg-slate-50 rounded-lg text-center">
                                    <span className="block font-bold text-lg text-slate-900">48</span>
                                    <span className="text-xs text-slate-500 uppercase font-medium">Yêu thích</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="space-y-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left",
                                        activeTab === tab.id
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                            : "bg-white text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3">
                            {activeTab === 'info' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <h3 className="text-xl font-bold border-b border-slate-100 pb-4">Thông tin cơ bản</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                                            <input type="text" defaultValue="Nguyễn Văn User" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input type="email" defaultValue="user@example.com" disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                                            <input type="tel" placeholder="+84 ..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Thành phố</label>
                                            <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                                                <option>Hà Nội</option>
                                                <option>TP. Hồ Chí Minh</option>
                                                <option>Đà Nẵng</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'favorites' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center py-20 animate-in fade-in zoom-in-95 duration-300">
                                    <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Chưa có địa điểm yêu thích nào</p>
                                    <button className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                                        Khám phá ngay &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
