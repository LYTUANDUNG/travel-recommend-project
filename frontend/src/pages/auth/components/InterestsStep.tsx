import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface InterestsStepProps {
    formData: any;
    interestCategories: Array<{ id: string; name: string; image: string }>;
    toggleInterest: (id: string) => void;
    onBack: () => void;
    onRegister: () => void;
    loading: boolean;
}

export const InterestsStep: React.FC<InterestsStepProps> = React.memo(({
    formData,
    interestCategories,
    toggleInterest,
    onBack,
    onRegister,
    loading
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sở thích của bạn</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Chọn ít nhất 1 chủ đề bạn quan tâm</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {interestCategories.map(cat => {
                    const isSelected = formData.interests.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleInterest(cat.id)}
                            className={cn(
                                "relative group overflow-hidden rounded-xl aspect-[16/9] transition-all border-2",
                                isSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-transparent"
                            )}
                        >
                            <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className={cn(
                                "absolute inset-0 flex items-center justify-center bg-black/40 transition-colors",
                                isSelected ? "bg-primary-900/40" : "group-hover:bg-black/50"
                            )}>
                                <span className="text-white font-bold text-shadow-sm">{cat.name}</span>
                            </div>
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={onBack} className="flex-1 py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                    Quay lại
                </button>
                <button
                    onClick={onRegister}
                    disabled={formData.interests.length === 0 || loading}
                    className="flex-1 flex justify-center py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hoàn tất đăng ký'}
                </button>
            </div>
        </div>
    );
});
