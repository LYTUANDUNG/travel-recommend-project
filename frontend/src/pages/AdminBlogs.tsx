import { useState, useEffect } from 'react';
import { api } from '../api';
import { BookOpen, Plus, Trash2, Edit2, Loader2, Save, X, User } from 'lucide-react';

export default function AdminBlogs() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBlog, setEditingBlog] = useState<any | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        thumbnail_url: '',
        category: 'TRAVEL_GUIDE',
        author_name: 'Admin'
    });

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            // Add timestamp for cache busting
            const res = await api.blog.getAll({ t: Date.now() });
            if (res.success) {
                // Backend returns Page<BlogDto>, extract .content
                const data = res.data as any;
                const blogList = data.content || (Array.isArray(data) ? data : []);
                // Sort by date descending locally as well, just in case
                const sorted = [...blogList].sort((a, b) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA;
                });
                setBlogs(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const resetForm = () => {
        setFormData({ title: '', excerpt: '', content: '', thumbnail_url: '', category: 'TRAVEL_GUIDE', author_name: 'Admin' });
        setEditingBlog(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = editingBlog 
                ? await api.blog.update(editingBlog.id, formData)
                : await api.blog.create(formData);
            
            if (res.success) {
                alert(editingBlog ? "Cập nhật bài viết thành công!" : "Đăng bài viết thành công!");
                // Give a small delay for DB commit if needed, then fetch
                setTimeout(() => fetchBlogs(), 500);
                resetForm();
            } else {
                alert(res.message || "Lỗi xử lý");
            }
        } catch (error) {
            alert("Lỗi hệ thống");
        }
    };

    const handleEdit = (blog: any) => {
        setEditingBlog(blog);
        setFormData({
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
            thumbnail_url: blog.thumbnail_url,
            category: blog.category || 'TRAVEL_GUIDE',
            author_name: blog.author_name || 'Admin'
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Xóa bài viết này?")) return;
        try {
            const res = await api.blog.delete(id);
            if (res.success) fetchBlogs();
        } catch (error) {
            alert("Lỗi xóa");
        }
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-indigo-500" />
                        Quản lý Blog
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Viết bài truyền cảm hứng du lịch cho người dùng.</p>
                </div>
                <button 
                    onClick={() => setShowForm(true)} 
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    Thêm bài viết
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{editingBlog ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h2>
                        <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tiêu đề</label>
                                <input 
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ảnh bìa (URL)</label>
                                <input 
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={formData.thumbnail_url}
                                    onChange={e => setFormData({...formData, thumbnail_url: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Danh mục</label>
                                <select 
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="TRAVEL_GUIDE">Cẩm nang du lịch</option>
                                    <option value="FOOD">Ẩm thực</option>
                                    <option value="BEACH">Biển đảo</option>
                                    <option value="CULTURE">Văn hóa</option>
                                    <option value="NEWS">Tin tức</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mô tả ngắn (Excerpt)</label>
                            <textarea 
                                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all h-20"
                                value={formData.excerpt}
                                onChange={e => setFormData({...formData, excerpt: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nội dung bài viết</label>
                            <textarea 
                                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all h-60"
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="px-8 py-3 font-bold text-slate-500">Hủy</button>
                            <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                {editingBlog ? 'Cập nhật' : 'Đăng bài'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(blogs || []).map(blog => (
                    <div key={blog.id} className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
                        <div className="h-48 overflow-hidden relative">
                            <img src={blog.thumbnail_url || 'https://via.placeholder.com/400x200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.title} />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => handleEdit(blog)} className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl text-slate-700 dark:text-white shadow-sm transition-all active:scale-90"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(blog.id)} className="p-2 bg-rose-500/90 backdrop-blur-md rounded-xl text-white shadow-sm transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1 mb-2">{blog.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed font-medium">{blog.excerpt}</p>
                            <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
                                <span>{blog.created_at && !isNaN(Date.parse(blog.created_at)) ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới đăng'}</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {blog.author_name || 'Admin'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
