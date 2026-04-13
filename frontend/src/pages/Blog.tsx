import { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Blog() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.blog.getAll({ t: Date.now() })
            .then(res => {
                // Backend returns Page<BlogDto>, extract .content
                if (res.success) {
                    const data = res.data as any;
                    const blogList = data.content || (Array.isArray(data) ? data : []);
                    // Sort by newest first
                    setBlogs([...blogList].sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                    }));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-20 pb-20">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 py-16 text-center">
                    <span className="text-primary-600 font-bold tracking-wider uppercase text-sm mb-2 block">Blog Du Lịch</span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">Cảm hứng & Chia sẻ</h1>
                    <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-lg">
                        Những câu chuyện, kinh nghiệm và bí kíp du lịch hữu ích từ cộng đồng đam mê xê dịch.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map(blog => (
                        <article key={blog.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800 group">
                            <div className="h-64 overflow-hidden relative">
                                <img
                                    src={blog.thumbnail_url || 'https://via.placeholder.com/800x400'}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary-600">
                                    {blog.category || 'Du lịch'}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-slate-400 text-xs mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới đăng'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{blog.author_name || 'Admin'}</span>
                                    </div>
                                </div>
                                <h3 
                                    onClick={() => navigate(`/blog/${blog.id}`)}
                                    className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer"
                                >
                                    {blog.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                                    {blog.excerpt || (blog.content ? blog.content.substring(0, 150) + '...' : '')}
                                </p>
                                <button 
                                    onClick={() => navigate(`/blog/${blog.id}`)}
                                    className="flex items-center gap-2 text-primary-600 font-bold text-sm hover:gap-3 transition-all group-hover:text-primary-700"
                                >
                                    Đọc tiếp <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
