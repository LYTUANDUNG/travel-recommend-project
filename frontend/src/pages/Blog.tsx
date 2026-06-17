import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader, PageShell, Surface } from '../components/ui/AppPage';
import { api } from '../api';
import { cn } from '../utils/cn';

export const translateBlogCategory = (cat: string | undefined): string => {
  if (!cat) return 'Du lịch';
  const mapping: Record<string, string> = {
    'TRAVEL_GUIDE': 'Cẩm nang du lịch',
    'FOOD': 'Ẩm thực',
    'BEACH': 'Biển đảo',
    'CULTURE': 'Văn hóa',
    'NEWS': 'Tin tức',
    'TRAVEL': 'Du lịch'
  };
  const normalized = String(cat).toUpperCase();
  return mapping[normalized] || cat;
};

export default function Blog() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const tabs = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'TRAVEL_GUIDE', label: 'Cẩm nang du lịch' },
        { key: 'FOOD', label: 'Ẩm thực' },
        { key: 'BEACH', label: 'Biển đảo' },
        { key: 'CULTURE', label: 'Văn hóa' },
        { key: 'NEWS', label: 'Tin tức' }
    ];

    useEffect(() => {
        setLoading(true);
        const params: any = { t: Date.now() };
        if (selectedCategory !== 'ALL') {
            params.category = selectedCategory;
        }
        api.blog.getAll(params)
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
    }, [selectedCategory]);

    return (
        <PageShell>
            <PageContainer className="pt-8 space-y-8">
                <PageHeader
                    eyebrow="Blog du lịch"
                    title="Cẩm nang & chia sẻ"
                    description="Những câu chuyện, kinh nghiệm và bí kíp du lịch hữu ích từ cộng đồng VinaTravel."
                />

                {/* Category tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-slate-200/40 dark:border-slate-800/80">
                    {tabs.map(tab => {
                        const isActive = selectedCategory === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedCategory(tab.key)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-300 shrink-0 border",
                                    isActive
                                        ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/10"
                                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {blogs.map(blog => (
                            <article
                                key={blog.id || blog.post_id}
                                className="group premium-card card-hover cursor-pointer flex flex-col h-full overflow-hidden"
                                onClick={() => navigate(`/blog/${blog.id || blog.post_id}`)}
                            >
                                <div className="h-56 overflow-hidden relative shrink-0">
                                    <img
                                        src={blog.thumbnail_url || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'}
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-500 shadow-sm border border-white/20">
                                        {translateBlogCategory(blog.category || blog.category_name)}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 text-slate-400 text-xs mb-3 font-semibold">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới đăng'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" />
                                                {blog.author_name || 'Admin'}
                                            </span>
                                        </div>
                                        <h3 className="font-serif text-lg font-black text-slate-950 dark:text-white mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors leading-snug">
                                            {blog.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-6 font-medium">
                                            {blog.excerpt || (blog.content ? `${blog.content.substring(0, 150)}...` : '')}
                                        </p>
                                    </div>
                                    <div className="mt-6 inline-flex items-center gap-2 text-orange-500 font-extrabold uppercase tracking-wider text-[10px]">
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
