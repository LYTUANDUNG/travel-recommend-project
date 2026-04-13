import { Users, MapPin, Eye, TrendingUp, ArrowUpRight, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
    { name: 'T2', views: 4000, searches: 2400 },
    { name: 'T3', views: 3000, searches: 1398 },
    { name: 'T4', views: 2000, searches: 9800 },
    { name: 'T5', views: 2780, searches: 3908 },
    { name: 'T6', views: 1890, searches: 4800 },
    { name: 'T7', views: 2390, searches: 3800 },
    { name: 'CN', views: 3490, searches: 4300 },
];

import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminDashboard() {
    const [statsData, setStatsData] = useState({
        total_users: 0,
        total_locations: 0,
        total_reviews: 0,
        total_photos: 0
    });

    useEffect(() => {
        api.client.get('/admin/dashboard/stats').then(res => {
            if (res.data.success) {
                setStatsData(res.data.data);
            }
        }).catch(err => console.error("Lỗi lấy thống kê", err));
    }, []);

    const stats = [
        { title: 'Lữ khách đồng hành', val: statsData.total_users, trend: 'Đang tăng', icon: Users, color: 'primary' },
        { title: 'Điểm đến khám phá', val: statsData.total_locations, trend: 'Đã xác thực', icon: MapPin, color: 'emerald' },
        { title: 'Câu chuyện sẻ chia', val: statsData.total_reviews, trend: '+12% tuần', icon: Eye, color: 'blue' },
        { title: 'Khoảnh khắc ghi lại', val: statsData.total_photos, trend: 'Bộ sưu tập', icon: TrendingUp, color: 'orange' },
    ];

    const colorClasses: Record<string, string> = {
        primary: 'from-primary-500 to-primary-600 shadow-primary-200',
        emerald: 'from-emerald-400 to-teal-600 shadow-emerald-200',
        blue: 'from-blue-500 to-cyan-600 shadow-blue-200',
        orange: 'from-orange-400 to-amber-600 shadow-orange-200',
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="animate-in slide-in-from-left duration-1000">
                    <h1 className="text-5xl font-serif font-black text-slate-950 dark:text-white tracking-tighter leading-none mb-4">
                        Discovery <br/><span className="text-primary-600">Control Center.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed max-w-xl">
                        Chào buổi sáng, Quản trị viên! Hôm nay là một ngày tuyệt vời để tối ưu hóa những trải nghiệm khám phá cho người dùng.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái hệ thống</p>
                        <p className="text-emerald-500 font-bold flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             Hoạt động tốt
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[s.color]} flex items-center justify-center text-white shadow-lg`}>
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold ring-1 ring-emerald-100 dark:ring-emerald-900/50">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {s.trend}
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{s.title}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{s.val}</p>
                        </div>
                        {/* Decorative background circle */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full transition-transform duration-500" />
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Hành vi Người dùng</h3>
                            <p className="text-sm text-slate-500 font-medium">Lượt click và tìm kiếm trong tuần qua</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary-500" />
                                <span className="text-xs font-bold text-slate-500">Xem địa điểm</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <span className="text-xs font-bold text-slate-500">Tìm kiếm</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        borderRadius: '16px', 
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="searches" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSearches)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-14 h-14 rounded-2xl bg-primary-500/20 backdrop-blur-md flex items-center justify-center mb-6 border border-primary-500/30">
                            <BarChart2 className="w-7 h-7 text-primary-400" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Academic Evaluation</h3>
                        <p className="text-slate-400 font-medium mb-8 text-sm">Chỉ số hiệu năng của thuật toán Recommendation (Hybrid Content-Based).</p>
                        
                        <div className="space-y-6">
                            <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Precision @ 5 (Độ chính xác)</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="w-[88%] h-full bg-primary-500 rounded-full" />
                                    </div>
                                    <span className="text-sm font-black">88%</span>
                                </div>
                            </div>

                            <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Recall @ 10 (Độ phủ)</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="w-[74%] h-full bg-emerald-500 rounded-full" />
                                    </div>
                                    <span className="text-sm font-black">74%</span>
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <p className="text-[10px] uppercase font-bold text-primary-500 mb-2">Trọng số thuật toán (Weights)</p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold">Content: 0.6</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold">Dist: 0.3</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold">Ctx: 0.1</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => window.location.href='/admin/users'} className="flex items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all text-left group airy-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">Quản lý Người dùng</h4>
                        <p className="text-sm text-slate-500">Phân quyền, theo dõi hành vi và sở thích khách hàng.</p>
                    </div>
                </button>
                <button onClick={() => window.location.href='/admin/reviews'} className="flex items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all text-left group airy-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Eye className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">Kiểm duyệt Bình luận</h4>
                        <p className="text-sm text-slate-500">Quản lý phản hồi và dữ liệu đầu vào cho CF và Content-based.</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
