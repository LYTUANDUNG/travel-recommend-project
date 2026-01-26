import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock register logic
        setTimeout(() => setLoading(false), 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-3xl opacity-50" />
                <div className="absolute -top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-secondary-200/20 blur-3xl opacity-50" />
            </div>

            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl relative z-10 border border-slate-100">
                <div className="text-center">
                    <h2 className="text-3xl font-serif font-bold text-slate-900">Tạo tài khoản mới</h2>
                    <p className="mt-2 text-slate-700 font-medium">
                        Bắt đầu hành trình khám phá của bạn ngay hôm nay
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500">
                        Bằng cách đăng ký, bạn đồng ý với <a href="#" className="underline hover:text-primary-600">Điều khoản sử dụng</a> và <a href="#" className="underline hover:text-primary-600">Chính sách bảo mật</a> của chúng tôi.
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng ký tài khoản'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
