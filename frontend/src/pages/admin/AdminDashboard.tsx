import { useState, useEffect } from 'react';
import { api } from '../../api';
import { 
    Users, 
    MapPin, 
    MessageSquare, 
    Activity, 
    ArrowUpRight, 
    ArrowDownRight,
    Calendar,
    Search,
    Bell,
    ChevronRight,
    TrendingUp,
    Shield,
    Database,
    Zap,
    Eye,
    Layout,
    BarChart2,
    Compass,
    Play,
    Terminal as TerminalIcon,
    Cpu,
    AlertCircle,
    CheckCircle2,
    Download,
    Info,
    RefreshCw
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const defaultChartData = [
    { name: 'T2', views: 400, clicks: 240 },
    { name: 'T3', views: 300, clicks: 139 },
    { name: 'T4', views: 600, clicks: 480 },
    { name: 'T5', views: 800, clicks: 590 },
    { name: 'T6', views: 500, clicks: 390 },
    { name: 'T7', views: 900, clicks: 680 },
    { name: 'CN', views: 1100, clicks: 920 },
];

export default function AdminDashboard() {
    const [statsData, setStatsData] = useState<any>({
        total_users: 0,
        total_locations: 0,
        total_reviews: 0,
        total_visits: 0,
        avg_rating: 0
    });
    const [chartData, setChartData] = useState<any[]>(defaultChartData);





    useEffect(() => {
        api.admin.getStats().then(res => {
            if (res.success) {
                console.log("Dashboard Stats Data:", res.data);
                setStatsData(res.data);
                
                if (res.data.activity_stats) {
                    const statsList = res.data.activity_stats;
                    const dailyDataMap = new Map();
                    
                    statsList.forEach((item: any) => {
                        // Support both camelCase and snake_case from projection
                        const dateStr = item.log_date || item.logDate;
                        const action = item.action_name || item.actionName;
                        const count = item.action_count || item.actionCount || 0;

                        if (!dateStr) return;
                        
                        const displayDate = new Date(dateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
                        
                        if (!dailyDataMap.has(dateStr)) {
                            dailyDataMap.set(dateStr, { name: displayDate, views: 0, clicks: 0 });
                        }
                        
                        const current = dailyDataMap.get(dateStr);
                        if (action === 'VIEW_DETAILS') {
                            current.views += count;
                        } else {
                            current.clicks += count;
                        }
                    });
                    
                    const sortedData = Array.from(dailyDataMap.entries())
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(entry => entry[1]);
                        
                    setChartData(sortedData);
                }
            }
        }).catch(err => console.error("Lỗi lấy thống kê", err));
    }, []);

    const dashboardStats = [
        { title: 'Người dùng', val: statsData.total_users, trend: statsData.user_trend || '0%', icon: Users, color: 'blue' },
        { title: 'Địa điểm du lịch', val: statsData.total_locations, trend: statsData.location_trend || '0%', icon: MapPin, color: 'emerald' },
        { title: 'Lượt khám phá', val: statsData.total_visits || 0, trend: '+0.0%', icon: Compass, color: 'orange' },
        { title: 'Đánh giá', val: statsData.total_reviews, trend: statsData.review_trend || '0%', icon: MessageSquare, color: 'amber' },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'from-blue-600 to-blue-800 shadow-blue-100',
        emerald: 'from-emerald-500 to-teal-700 shadow-emerald-100',
        amber: 'from-amber-500 to-orange-700 shadow-amber-100',
        rose: 'from-rose-500 to-pink-700 shadow-rose-100',
        orange: 'from-orange-500 to-amber-700 shadow-orange-100',
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                        Hệ thống <span className="text-orange-600">Quản trị.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm max-w-xl">
                        Chào buổi sáng! Theo dõi hiệu suất và quản lý dữ liệu hệ thống du lịch của bạn.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Hệ thống ổn định</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {dashboardStats.map((s, i) => (
                    <div key={i} className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[s.color]} flex items-center justify-center text-white shadow-lg`}>
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <div className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    {s.trend}
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.title}</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="w-full">
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200/70 dark:border-slate-800 shadow-sm transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Database className="w-5 h-5 text-orange-500" />
                                Phân tích & Trực quan Hiệu suất
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Theo dõi tương tác người dùng và hoạt động API thời gian thực.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-3 py-1 rounded-full">
                                Realtime API Telemetry
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Dữ liệu 7 ngày qua</span>
                        </div>
                        <div className="h-[360px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                            borderRadius: '16px', 
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                                        }}
                                    />
                                    <Area type="monotone" dataKey="views" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" name="Lượt xem địa điểm" />
                                    <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" name="Tương tác nút bấm" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => window.location.href='/admin/users'} className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-all duration-300 text-left group">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold font-serif text-slate-900 dark:text-white">Quản lý Người dùng</h4>
                        <p className="text-sm text-slate-500">Phân quyền, theo dõi hành vi khách hàng.</p>
                    </div>
                </button>
                <button onClick={() => window.location.href='/admin/locations'} className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all duration-300 text-left group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Layout className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold font-serif text-slate-900 dark:text-white">Quản lý Địa điểm</h4>
                        <p className="text-sm text-slate-500">Chỉnh sửa thông tin và kho dữ liệu du lịch.</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

