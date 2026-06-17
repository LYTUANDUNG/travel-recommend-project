import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

interface PersonalInfoStepProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    selectedProvince: string;
    selectedWard: string;
    setSelectedWard: (val: string) => void;
    currentWards: any[];
    provinces: any[];
    isLoadingAddress: boolean;
    addressError: string | null;
    handleProvinceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = React.memo(({
    formData,
    setFormData,
    selectedProvince,
    selectedWard,
    setSelectedWard,
    currentWards,
    provinces,
    isLoadingAddress,
    addressError,
    handleProvinceChange,
    onNext,
    onBack
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Giúp chúng tôi gợi ý địa điểm phù hợp nhất</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Năm sinh</label>
                <div className="relative">
                    <Calendar className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <select
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        value={formData.birthYear}
                        onChange={e => setFormData((prev: any) => ({ ...prev, birthYear: e.target.value }))}
                    >
                        <option value="">Chọn năm sinh</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nơi sinh sống (Dữ liệu Open API)</label>

                {addressError && (
                    <div className="text-red-500 text-xs p-2 bg-red-50 rounded">
                        Lỗi tải dữ liệu: {addressError}
                    </div>
                )}

                {/* Lựa chọn Tỉnh/Thành phố */}
                <div className="relative">
                    <MapPin className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <select
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        disabled={isLoadingAddress}
                    >
                        <option value="">{isLoadingAddress ? "Đang tải dữ liệu..." : "Chọn Tỉnh / Thành phố"}</option>
                        {provinces.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.full_name}</option>
                        ))}
                    </select>
                </div>

                {/* Lựa chọn Phường/Xã */}
                <div className="relative">
                    <MapPin className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <select
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        disabled={!selectedProvince}
                    >
                        <option value="">Chọn Phường / Xã</option>
                        {currentWards.map((w) => (
                            <option key={w.id} value={w.id}>{w.fullName}</option>
                        ))}
                    </select>
                    {selectedProvince && currentWards.length === 0 && !isLoadingAddress && (
                        <p className="text-xs text-orange-500 mt-1">Không tìm thấy dữ liệu phường xã.</p>
                    )}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={onBack} className="flex-1 py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                    Quay lại
                </button>
                <button
                    onClick={onNext}
                    disabled={!formData.birthYear || !selectedWard}
                    className="flex-1 py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );
});
