import { Users, MapPin, Eye, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'T2', views: 4000, searches: 2400 },
    { name: 'T3', views: 3000, searches: 1398 },
    { name: 'T4', views: 2000, searches: 9800 },
    { name: 'T5', views: 2780, searches: 3908 },
    { name: 'T6', views: 1890, searches: 4800 },
    { name: 'T7', views: 2390, searches: 3800 },
    { name: 'CN', views: 3490, searches: 4300 },
];

export default function AdminDashboard() {
    const stats = [
        { title: 'Tổng Khách hàng', val: '1,245', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { title: 'Tổng Địa điểm', val: '43', icon: MapPin, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
        { title: 'Lượt Truy cập Tuần', val: '24,592', icon: Eye, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { title: 'Độ Tương tác AI', val: '+45%', icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Tổng Quan Hệ Thống</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg}`}>
                            <s.icon className={`w-7 h-7 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{s.title}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Biểu đồ Lượt xem & Tìm kiếm Địa điểm (AI Behavior Logs)</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="views" name="Lượt Click Xem" stroke="#6366f1" fill="#818cf8" fillOpacity={0.2} strokeWidth={3} />
                            <Area type="monotone" dataKey="searches" name="Lượt Tìm kiếm" stroke="#10b981" fill="#34d399" fillOpacity={0.2} strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
