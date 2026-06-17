import { useState, useEffect } from 'react';
import { Compass, Check } from 'lucide-react';
import { api } from '../api';

export default function OnboardingModal({ user, onClose }: { user: any, onClose: () => void }) {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.category.getAll().then(res => {
            if (res.success) setCategories(res.data);
        });
    }, []);

    const handleSave = async () => {
        if (selectedIds.length === 0) return onClose();
        setLoading(true);
        await api.user.saveInterests(user.user_id || user.id, selectedIds);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen custom-scrollbar overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl p-8 my-auto relative border border-slate-100 dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary-100 dark:border-primary-800">
                        <Compass className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white">Chào mừng bạn, {user.full_name || 'Người dùng mới'}!</h2>
                    <p className="text-slate-500 mt-2">Chọn 2-5 chủ đề bạn yêu thích để hệ thống có cấu hình gợi ý cá nhân hóa chính xác nhất.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center mb-10 max-h-[40vh] overflow-y-auto p-2 border-t border-b border-slate-50 dark:border-slate-800/50 py-6">
                    {categories.map(c => {
                        const catId = c.category_id || c.id;
                        const isSelected = selectedIds.includes(catId);
                        return (
                            <button
                                key={catId}
                                onClick={() => {
                                    if (isSelected) setSelectedIds(selectedIds.filter(id => id !== catId));
                                    else setSelectedIds([...selectedIds, catId]);
                                }}
                                className={`px-5 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all border-2 
                                ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 shadow-sm' : 'border-slate-100 dark:border-slate-800 hover:border-primary-300 text-slate-500 dark:text-slate-400'}`}
                            >
                                {isSelected && <Check className="w-4 h-4" />}
                                {c.name}
                            </button>
                        );
                    })}
                </div>
                
                <div className="flex justify-center items-center">
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-full font-black text-lg transition-transform active:scale-95 disabled:opacity-50 shadow-xl shadow-primary-600/30"
                    >
                        {loading ? 'Đang kích hoạt AI...' : 'Bắt đầu Khám phá'}
                    </button>
                    <button onClick={onClose} className="ml-6 px-4 py-2 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Để sau</button>
                </div>
            </div>
        </div>
    );
}
