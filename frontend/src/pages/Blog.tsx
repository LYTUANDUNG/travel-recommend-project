import { Calendar, User, ArrowRight } from 'lucide-react';

export default function Blog() {
    const blogs = [
        {
            id: 1,
            title: "Top 10 bãi biển đẹp nhất Việt Nam bạn không thể bỏ lỡ",
            excerpt: "Từ Phú Quốc đến Đà Nẵng, hãy cùng khám phá những thiên đường biển xanh cát trắng tuyệt đẹp...",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            author: "Admin",
            date: "20 T12, 2024",
            category: "Du lịch biển"
        },
        {
            id: 2,
            title: "Kinh nghiệm du lịch Hội An tự túc: Ăn gì, Đi đâu?",
            excerpt: "Hội An không chỉ có phố cổ, còn có những quán cafe ẩn mình và những món ngon đường phố...",
            image: "https://images.unsplash.com/photo-1557750255-c76072a7bb19",
            author: "Hương Ly",
            date: "18 T12, 2024",
            category: "Cẩm nang"
        },
        {
            id: 3,
            title: "Khám phá ẩm thực đường phố Sài Gòn về đêm",
            excerpt: "Sài Gòn không ngủ, và cái bụng của bạn cũng sẽ không được nghỉ ngơi với danh sách món ngon này...",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
            author: "Tuấn Anh",
            date: "15 T12, 2024",
            category: "Ẩm thực"
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen pt-20 pb-20">
            <div className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 py-16 text-center">
                    <span className="text-primary-600 font-bold tracking-wider uppercase text-sm mb-2 block">Blog Du Lịch</span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Cảm hứng & Chia sẻ</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                        Những câu chuyện, kinh nghiệm và bí kíp du lịch hữu ích từ cộng đồng đam mê xê dịch.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map(blog => (
                        <article key={blog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 group">
                            <div className="h-64 overflow-hidden relative">
                                <img
                                    src={blog.image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary-600">
                                    {blog.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-slate-400 text-xs mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{blog.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{blog.author}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-slate-900 mb-3 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
                                    {blog.title}
                                </h3>
                                <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                                    {blog.excerpt}
                                </p>
                                <button className="flex items-center gap-2 text-primary-600 font-bold text-sm hover:gap-3 transition-all group-hover:text-primary-700">
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
