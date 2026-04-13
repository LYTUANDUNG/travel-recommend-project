import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';

function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.email) {
            api.newsletter.getStatus(user.email).then(res => {
                if (res.success) setIsSubscribed(res.data);
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.newsletter.subscribe(email);
            if (res.success) {
                setIsSubscribed(true);
                setEmail('');
            } else {
                alert(res.message);
            }
        } catch (error) {
            alert("Lỗi đăng ký");
        } finally {
            setLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <div className="bg-primary-500/20 text-primary-400 p-4 rounded-lg text-sm font-medium border border-primary-500/30 animate-in zoom-in duration-300">
                Bạn đã đăng ký nhận tin! ✨
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-900 dark:text-white"
            />
            <button 
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
                {loading ? 'Đang gửi...' : 'Đăng ký'}
            </button>
        </form>
    );
}

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 dark:bg-slate-900 dark:border-none text-slate-700 dark:text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-serif font-bold text-primary-600 dark:text-primary-400">Travel</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Khám phá vẻ đẹp Việt Nam.
                            Lịch trình được cá nhân hóa dành riêng cho bạn.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Liên kết nhanh</h4>
                        <ul className="space-y-3 text-slate-500 dark:text-slate-400 text-sm">
                            <li><a href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Trang chủ</a></li>
                            <li><a href="/explore" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Khám phá</a></li>
                            <li><a href="/recommend" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Gợi ý cho bạn</a></li>
                            <li><a href="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Về chúng tôi</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Liên hệ</h4>
                        <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary-500 dark:text-primary-400 shrink-0" />
                                <span>123 Đường Nguyen Hue, Quận 1, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary-500 dark:text-primary-400 shrink-0" />
                                <span>+84 (028) 3838 3838</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary-500 dark:text-primary-400 shrink-0" />
                                <span>contact@travel.vn</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Đăng ký nhận tin</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                            Nhận những gợi ý du lịch mới nhất hàng tuần.
                        </p>
                        <NewsletterForm />
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 dark:text-slate-500 text-sm">
                        © 2024 Travel. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-white hover:bg-primary-600 dark:hover:bg-primary-600 transition-all">
                            <Facebook className="w-4 h-4" />
                        </a>
                        <a href="#" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-white hover:bg-primary-600 dark:hover:bg-primary-600 transition-all">
                            <Instagram className="w-4 h-4" />
                        </a>
                        <a href="#" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-white hover:bg-primary-600 dark:hover:bg-primary-600 transition-all">
                            <Twitter className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
