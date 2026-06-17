import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';
import { api } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
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
                setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác');
            }
        } catch (error) {
            console.error('Login error', error);
            setError('Lỗi kết nối tới máy chủ');
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

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
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
                            <Link to="/forgot-password" data-id="forgot-password-link" className="font-medium text-primary-600 hover:text-primary-500">
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập'}
                    </button>
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
