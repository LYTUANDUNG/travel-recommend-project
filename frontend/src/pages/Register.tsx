import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, Calendar, MapPin, Search, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';
import { useAddress } from '../hooks/useAddress';
import { useWeather } from '../hooks/useWeather'; // Import Weather Hook

// Categories for Interests Step
const INTEREST_CATEGORIES = [
    { id: 'Biển', name: 'Biển đảo', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
    { id: 'Núi', name: 'Núi rừng', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400' },
    { id: 'Văn hóa', name: 'Văn hóa', image: 'https://images.unsplash.com/photo-1557124816-e9b7d5440de2?w=400' },
    { id: 'Ẩm thực', name: 'Ẩm thực', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
    { id: 'Nghỉ dưỡng', name: 'Nghỉ dưỡng', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400' },
    { id: 'Mạo hiểm', name: 'Mạo hiểm', image: 'https://images.unsplash.com/photo-1522163176141-8f1585b46765?w=400' },
];

export default function Register() {
    const navigate = useNavigate();
    const loginAsUser = useAuthStore(s => s.loginAsUser);

    // Custom Hook for Address Logic (International Standard: Separation of Concerns)
    const { provinces, getWardsByProvince, isLoading: isLoadingAddress, error: addressError } = useAddress();
    const { weather, loading: weatherLoading, fetchWeather } = useWeather(); // Init Weather Hook

    // Wizard State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthYear: '',
        province: '',
        interests: [] as string[]
    });

    // Local UI State for Address
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [currentWards, setCurrentWards] = useState<any[]>([]); // Async State

    // Handlers
    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedProvince(id);
        setSelectedWard(''); // Reset ward
        setCurrentWards([]); // Clear while loading

        // Find name for form data
        const province = provinces.find(p => p.id === id);
        const provinceName = province?.full_name || '';
        setFormData(prev => ({ ...prev, province: provinceName }));

        // Lazy Fetch Wards
        if (id) {
            const wards = await getWardsByProvince(id);
            setCurrentWards(wards);
        }

        // 2. Trigger Weather API (New Feature)
        if (provinceName) {
            fetchWeather(provinceName);
        }
    };

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Step 1 Validation
        if (step === 1) {
            if (!formData.name || formData.name.length < 2) {
                alert("Vui lòng nhập họ tên đầy đủ (tối thiểu 2 ký tự)");
                return;
            }
            if (!formData.email || !formData.email.includes('@')) {
                alert("Vui lòng nhập email hợp lệ");
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                alert("Mật khẩu phải từ 6 ký tự trở lên");
                return;
            }
        }
        
        // Step 2 Validation handled by button 'disabled' state, but adding a check just in case
        if (step === 2) {
            const currentYear = new Date().getFullYear();
            const year = parseInt(formData.birthYear);
            if (isNaN(year) || year < 1900 || year > currentYear) {
                alert("Năm sinh không hợp lệ");
                return;
            }
            if (!selectedWard) {
                alert("Vui lòng chọn Tỉnh/Thành và Phường/Xã");
                return;
            }
        }

        setStep(p => p + 1);
    };

    const handleBack = () => {
        setStep(p => p - 1);
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            // Find full Ward name
            const ward = currentWards.find(w => w.id === selectedWard);
            const fullAddress = ward ? `${ward.fullName}, ${formData.province}` : formData.province;

            const res = await api.auth.register({
                username: formData.email.split('@')[0],
                email: formData.email,
                password: formData.password,
                full_name: formData.name,
                birth_year: parseInt(formData.birthYear),
                province: fullAddress, // Save standardized address
                interests: formData.interests,
                role: 'USER',
                created_at: new Date().toISOString()
            });

            if (res.success && res.data) {
                loginAsUser(res.data);
                navigate('/');
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (id: string) => {
        setFormData(prev => {
            if (prev.interests.includes(id)) {
                return { ...prev, interests: prev.interests.filter(i => i !== id) };
            } else {
                return { ...prev, interests: [...prev.interests, id] };
            }
        });
    };

    // Render Steps
    const renderStep1 = () => (
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
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                <div className="relative">
                    <Lock className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                    <input
                        type="password" required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
            </div>
            <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition">
                Tiếp tục <ChevronRight className="w-5 h-5 ml-1" />
            </button>
        </div>
    );

    const renderStep2 = () => (
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
                        onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
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

                {/* Province Select */}
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

                {/* Ward Select (Flattened 2-Level) */}
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
                <button onClick={handleBack} className="flex-1 py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                    Quay lại
                </button>
                <button
                    onClick={handleNext}
                    disabled={!formData.birthYear || !selectedWard}
                    className="flex-1 py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sở thích của bạn</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Chọn ít nhất 1 chủ đề bạn quan tâm</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {INTEREST_CATEGORIES.map(cat => {
                    const isSelected = formData.interests.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
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
                <button onClick={handleBack} className="flex-1 py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                    Quay lại
                </button>
                <button
                    onClick={handleRegister}
                    disabled={formData.interests.length === 0 || loading}
                    className="flex-1 flex justify-center py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hoàn tất đăng ký'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl relative z-10 border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full bg-primary-500 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="text-center mb-8 mt-2">
                    <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                        {step === 1 && 'Tạo tài khoản'}
                        {step === 2 && 'Thông tin cá nhân'}
                        {step === 3 && 'Sở thích du lịch'}
                    </h2>
                    <div className="flex justify-center gap-2 mt-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", i === step ? "bg-primary-500" : "bg-slate-200 dark:bg-slate-700")} />
                        ))}
                    </div>
                </div>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                {step === 1 && (
                    <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Đăng nhập
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
