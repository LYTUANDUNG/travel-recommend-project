import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader, PageShell, Surface } from '../components/ui/AppPage';
import { api } from '../api';

export default function Blog() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.blog.getAll({ t: Date.now() })
            .then(res => {
                if (res.success) {
                    const data = res.data as any;
                    const blogList = data.content || (Array.isArray(data) ? data : []);
                    setBlogs([...blogList].sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                    }));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <PageShell>
            <PageContainer className="pt-8 space-y-8">
                <PageHeader
                    eyebrow="Blog du lịch"
                    title="Cẩm nang & chia sẻ"
                    description="Những câu chuyện, kinh nghiệm và bí kíp du lịch hữu ích từ cộng đồng VinaTravel."
                />

                {loading ? (
                    <Surface className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </Surface>
                ) : blogs.length === 0 ? (
                    <Surface className="p-12 text-center">
                        <h2 className="text-xl font-black">Chưa có bài viết</h2>
                        <p className="mt-2 text-sm text-slate-500">Nội dung sẽ được cập nhật sau.</p>
                    </Surface>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {blogs.map(blog => (
                            <article
                                key={blog.id || blog.post_id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200/70 dark:border-slate-800 cursor-pointer"
                                onClick={() => navigate(`/blog/${blog.id || blog.post_id}`)}
                            >
                                <div className="h-56 overflow-hidden relative">
                                    <img
                                        src={blog.thumbnail_url || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'}
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500">
                                        {blog.category || blog.category_name || 'Du lịch'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-slate-400 text-xs mb-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới đăng'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" />
                                            {blog.author_name || 'Admin'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-950 dark:text-white mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors">
                                        {blog.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-6">
                                        {blog.excerpt || (blog.content ? `${blog.content.substring(0, 150)}...` : '')}
                                    </p>
                                    <div className="mt-5 inline-flex items-center gap-2 text-orange-500 font-black uppercase tracking-widest text-[10px]">
                                        Đọc tiếp <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </PageContainer>
        </PageShell>
    );
}
