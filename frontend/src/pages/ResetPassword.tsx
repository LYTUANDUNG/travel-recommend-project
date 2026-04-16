import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setError('Mã khôi phục không hợp lệ hoặc đã hết hạn.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const res = await api.auth.resetPassword(token, formData.password);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(res.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        } catch (err) {
            setError('Lỗi kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Lỗi truy cập</h2>
                    <p className="text-slate-600 mb-6">Mã khôi phục không hợp lệ.</p>
                    <button onClick={() => navigate('/login')} className="text-primary-600 font-bold underline">Quay lại đăng nhập</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl relative z-10 border border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-primary-600" />
                    </div>
                    
                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                    </p>
                </div>

                {success ? (
                    <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center animate-in fade-in zoom-in duration-500">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400 mb-2">Thành công!</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-500">
                            Mật khẩu của bạn đã được cập nhật. Hệ thống sẽ tự động chuyển hướng về trang đăng nhập trong giây lát...
                        </p>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                        placeholder="Tối thiểu 6 ký tự"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CheckCircle2 className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                        placeholder="Nhập lại mật khẩu"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
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
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cập nhật mật khẩu'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
