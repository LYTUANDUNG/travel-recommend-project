import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Loader2, Clock, Share2 } from 'lucide-react';
import { api } from '../api';

export default function BlogDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [blog, setBlog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        
        setLoading(true);
        api.blog.getById(parseInt(id))
            .then(res => {
                if (res.success) {
                    setBlog(res.data);
                }
            })
            .catch(err => {
                console.error("Failed to fetch blog detail:", err);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
    );

    if (!blog) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Không tìm thấy bài viết</h2>
            <button 
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2 text-primary-600 font-bold hover:underline"
            >
                <ArrowLeft className="w-4 h-4" /> Quay lại Blog
            </button>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-20 pb-20">
            {/* Header / Hero Section */}
            <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
                <img 
                    src={blog.thumbnail_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80'} 
                    alt={blog.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                    <div className="container mx-auto">
                        <button 
                            onClick={() => navigate('/blog')}
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" /> Quay lại Blog
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {blog.category || 'Du lịch'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
                            {blog.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xs">
                                    {blog.author_name?.[0] || 'A'}
                                </div>
                                <span>{blog.author_name || 'Admin'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Mới đây'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{Math.ceil((blog.content?.length || 0) / 1000) * 2} phút đọc</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 -mt-10 relative z-10 max-w-4xl">
                <article className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800">
                    {blog.excerpt && (
                        <div className="text-xl text-slate-600 dark:text-slate-300 font-medium italic border-l-4 border-primary-500 pl-6 mb-10 leading-relaxed">
                            {blog.excerpt}
                        </div>
                    )}
                    
                    <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                        {blog.content?.split('\n').map((paragraph: string, idx: number) => (
                            <p key={idx} className="mb-6 text-slate-700 dark:text-slate-300 leading-8">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <Share2 className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="text-sm text-slate-400 italic">
                            Chỉnh sửa lần cuối: {blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
}
