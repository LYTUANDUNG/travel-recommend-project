import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface Banner {
    id?: number;
    title: string;
    image_url: string;
    link: string;
    is_active: boolean;
    display_order: number;
}

export default function AdminBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [link, setLink] = useState('');

    const handleEdit = (b: Banner) => {
        setEditingId(b.id || null);
        setTitle(b.title);
        setImageUrl(b.image_url);
        setLink(b.link || '');
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setImageUrl('');
        setLink('');
    };

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = () => {
        setLoading(true);
        api.client.get('/banners').then(res => {
            if (res.data && res.data.success) {
                setBanners(res.data.data);
            }
        }).catch(err => console.error(err))
          .finally(() => setLoading(false));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !imageUrl) return alert("Vui lòng nhập tiêu đề và Link ảnh");
        const payload: any = { title, image_url: imageUrl, link, is_active: true, display_order: 0 };
        if (editingId) payload.id = editingId;
        
        api.client.post('/banners', payload).then(res => {
            if (res.data.success) {
                resetForm();
                loadBanners();
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm("Xóa banner này?")) return;
        api.client.delete(`/banners/${id}`).then(() => {
            loadBanners();
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Cấu hình Banner Quảng cáo
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Form */}
                <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-primary-500" /> Thêm Banner mới</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tiêu đề</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500" placeholder="Chương trình ưu đãi..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Link Ảnh (URL)</label>
                            <div className="flex relative">
                                <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500" placeholder="https://" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Đường dẫn khi click (Tùy chọn)</label>
                            <div className="flex relative">
                                <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input type="text" value={link} onChange={e => setLink(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500" placeholder="/explore" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none">
                                {editingId ? "Cập nhật" : "Lưu Banner"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent mx-auto rounded-full"></div></div> : 
                        banners.length === 0 ? <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">Chưa có banner nào.</div> :
                        banners.map(b => (
                            <div key={b.id} className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm items-center">
                                <div className="w-full sm:w-48 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700">
                                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{b.title}</h3>
                                    <p className="text-sm text-slate-500 truncate max-w-[300px]">{b.link || "Không điều hướng"}</p>
                                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                                        <CheckCircle2 className="w-3 h-3" /> Đang hiển thị
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleEdit(b)} className="w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl hover:bg-indigo-500 hover:text-white transition-colors">
                                        <Plus className="w-5 h-5 rotate-45" /> {/* Edit Icon roughly */}
                                    </button>
                                    <button onClick={() => handleDelete(b.id!)} className="w-12 h-12 flex items-center justify-center bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
