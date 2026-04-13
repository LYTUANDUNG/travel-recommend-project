import { useState, useEffect } from 'react';
import { api } from '../api';
import { Tag as TagType } from '../types/schema';
import { Trash2, Loader2, Tag as TagIcon, Plus, Filter, Info, ChevronRight } from 'lucide-react';

export default function AdminTags() {
    const [tags, setTags] = useState<TagType[]>([]);
    const [loading, setLoading] = useState(true);

    const [newTagName, setNewTagName] = useState('');
    const [newTagWeight, setNewTagWeight] = useState(1);

    const fetchTags = async () => {
        setLoading(true);
        const res = await api.tag.getAll();
        if (res.success) {
            setTags(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa Tag này? Các địa điểm đang sở hữu Tag này sẽ mất thông tin.")) return;

        const res = await api.tag.delete(id);
        if (res.success) {
            fetchTags();
        } else {
            alert("Lỗi khi xóa: " + res.message);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        const res = await api.tag.create({
            name: newTagName,
            weight: newTagWeight
        });

        if (res.success) {
            setNewTagName('');
            setNewTagWeight(1);
            fetchTags();
        } else {
            alert("Lỗi khi tạo Tag: " + res.message);
        }
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <TagIcon className="w-8 h-8 text-indigo-500" />
                    Quản lý Bộ lọc (Tags)
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Định nghĩa các thuộc tính giúp AI phân tích và gợi ý địa điểm chính xác hơn.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Add Tag */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8 outline outline-4 outline-slate-50 dark:outline-slate-950">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 font-black text-xl">
                            +
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Thêm Tag mới</h2>
                        <p className="text-sm text-slate-500 mb-8 font-medium italic">Gắn nhãn cho các địa điểm du lịch</p>
                        
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Tên Tag</label>
                                <input
                                    type="text"
                                    required
                                    value={newTagName}
                                    onChange={e => setNewTagName(e.target.value)}
                                    className="w-full px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Ví dụ: Bãi biển, Vintage..."
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest">Trọng số AI ({newTagWeight})</label>
                                    <div className="group relative">
                                        <Info className="w-4 h-4 text-slate-300 cursor-help" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                            Trọng số càng cao, AI càng ưu tiên gán thẻ này cho người dùng có sở thích tương đồng.
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    step={0.1}
                                    required
                                    value={newTagWeight}
                                    onChange={e => setNewTagWeight(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    <span>Thấp (1)</span>
                                    <span>Cao (10)</span>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Xác nhận thêm
                            </button>
                        </form>
                    </div>
                </div>

                {/* Table Tags */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden outline outline-4 outline-slate-50 dark:outline-slate-950">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Toàn bộ thẻ Tag
                            </h3>
                            <span className="text-xs font-bold text-slate-400">{tags.length} tags configured</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-black">
                                        <th className="px-8 py-5">Tên Tag</th>
                                        <th className="px-8 py-5">AI Relevance</th>
                                        <th className="px-8 py-5 text-right w-20">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {tags.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center text-slate-500 font-bold">Chưa có tag nào.</td>
                                        </tr>
                                    ) : tags.map((t) => (
                                        <tr key={t.tag_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                                                        <TagIcon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-base leading-none">
                                                        {t.name}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                                                            style={{ width: `${(t.weight / 10) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{t.weight}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button 
                                                    onClick={() => handleDelete(t.tag_id)} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
