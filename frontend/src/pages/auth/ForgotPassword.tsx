import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await api.auth.forgotPassword(email);
            if (res.success) {
                setSuccess(true);
            } else {
                setError(res.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        } catch (err) {
            setError('Lỗi kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl relative z-10 border border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại đăng nhập
                    </Link>
                    
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-primary-600" />
                    </div>
                    
                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Quên mật khẩu?</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
                    </p>
                </div>

                {success ? (
                    <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center animate-in fade-in zoom-in duration-500">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400 mb-2">Kiểm tra hộp thư!</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-500">
                            Chúng tôi đã gửi đường dẫn khôi phục mật khẩu tới <strong>{email}</strong>. Vui lòng kiểm tra email của bạn.
                        </p>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email tài khoản</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-center font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi yêu cầu'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
