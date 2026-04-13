import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Facebook } from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.auth.login(formData.email, formData.password);
            if (res.success && res.data) {
                const token = (res.data as any).token;
                const user = (res.data as any).user || res.data;
                
                if (token) {
                    localStorage.setItem('token', token);
                }
                
                useAuthStore.getState().loginAsUser(user);
                if (user.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                alert(res.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error', error);
            alert('Lỗi kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-3xl opacity-50" />
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary-200/20 blur-3xl opacity-50" />
            </div>

            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl relative z-10 border border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Chào mừng trở lại</h2>
                    <p className="mt-2 text-slate-700 dark:text-slate-300 font-medium">
                        Đăng nhập để khám phá những hành trình tuyệt vời
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                                Quên mật khẩu?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập'}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <span className="sr-only">Sign in with Google</span>
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.53-6.033-5.652s2.7-5.652 6.033-5.652c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.7-6.735-2.7-5.522 0-10 4.478-10 10s4.478 10 10 10c4.672 0 9.148-3.232 9.148-9.148 0-0.655-0.091-1.258-0.208-1.821h-9.208z" fill="currentColor" /></svg>
                        </button>
                        <button
                            type="button"
                            className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <span className="sr-only">Sign in with Facebook</span>
                            <Facebook className="w-5 h-5 text-blue-600" />
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}
