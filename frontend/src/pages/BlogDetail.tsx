import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Loader2, Share2 } from 'lucide-react';
import { PageContainer, PageHeader, PageShell, Surface, secondaryButtonClassName } from '../components/ui/AppPage';
import { api } from '../api';

export default function BlogDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [blog, setBlog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.blog.getById(Number(id))
            .then(res => {
                if (res.success) setBlog(res.data);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <PageShell className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </PageShell>
        );
    }

    if (!blog) {
        return (
            <PageShell>
                <PageContainer className="pt-8">
                    <Surface className="p-10 text-center">
                        <h1 className="text-2xl font-black">Không tìm thấy bài viết</h1>
                        <button onClick={() => navigate('/blog')} className={`${secondaryButtonClassName} mt-6`}>
                            <ArrowLeft className="w-4 h-4" /> Quay lại Blog
                        </button>
                    </Surface>
                </PageContainer>
            </PageShell>
        );
    }

    const cover = blog.thumbnail_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80';
    const readMinutes = Math.max(1, Math.ceil((blog.content?.length || 0) / 1000) * 2);

    return (
        <PageShell>
            <PageContainer className="pt-8 space-y-8">
                <PageHeader
                    media={cover}
                    eyebrow={blog.category || blog.category_name || 'Du lịch'}
                    title={blog.title}
                    description={blog.excerpt}
                    className="min-h-[360px] flex items-end"
                    actions={
                        <button onClick={() => navigate('/blog')} className={secondaryButtonClassName}>
                            <ArrowLeft className="w-4 h-4" /> Blog
                        </button>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <article className="lg:col-span-8">
                        <Surface className="p-6 md:p-10">
                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 mb-8">
                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}</span>
                                <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{readMinutes} phút đọc</span>
                            </div>

                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {blog.content?.split('\n').filter(Boolean).map((paragraph: string, index: number) => (
                                    <p key={index} className="mb-5 text-slate-700 dark:text-slate-300 leading-8">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </Surface>
                    </article>

                    <aside className="lg:col-span-4 lg:sticky lg:top-24">
                        <Surface className="p-6 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Bài viết</p>
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">{blog.title}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả: {blog.author_name || 'Admin'}</p>
                            <button className={secondaryButtonClassName}>
                                <Share2 className="w-4 h-4" /> Chia sẻ
                            </button>
                        </Surface>
                    </aside>
                </div>
            </PageContainer>
        </PageShell>
    );
}
