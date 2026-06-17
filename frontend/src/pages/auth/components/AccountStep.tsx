import React, { useState } from 'react';
import { User, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface AccountStepProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onNext: (e?: React.FormEvent) => void;
}

export const AccountStep: React.FC<AccountStepProps> = React.memo(({ formData, setFormData, onNext }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordValid = formData.password.length >= 8;

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ tên</label>
                <div className="relative">
                    <User className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <input
                        type="text" required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        placeholder="Nguyễn Văn A"
                        value={formData.name}
                        onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                    <Mail className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <input
                        type="email" required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                <div className="relative">
                    <Lock className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <p className={`text-xs mt-1.5 font-semibold ${formData.password ? (isPasswordValid ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400') : 'text-slate-400'}`}>
                    * Mật khẩu phải chứa từ 8 ký tự trở lên
                </p>
            </div>
            <button onClick={onNext} className="w-full flex justify-center py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition">
                Tiếp tục <ChevronRight className="w-5 h-5 ml-1" />
            </button>
        </div>
    );
});
