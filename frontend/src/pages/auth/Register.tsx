import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import { useAddress } from '../../hooks/useAddress';
import { AccountStep } from './components/AccountStep';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { InterestsStep } from './components/InterestsStep';

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

    const { provinces, getWardsByProvince, isLoading: isLoadingAddress, error: addressError } = useAddress();

    // Trạng thái từng bước của giao diện đăng ký
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Dữ liệu biểu mẫu
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthYear: '',
        province: '',
        interests: [] as string[]
    });

    // Trạng thái địa chỉ trên giao diện
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [currentWards, setCurrentWards] = useState<any[]>([]); // Danh sách phường xã lấy không đồng bộ

    // Các trình xử lý sự kiện
    const handleProvinceChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedProvince(id);
        setSelectedWard(''); // Reset ward
        setCurrentWards([]); // Clear while loading
        setError('');

        // Tìm tên tỉnh để lưu vào dữ liệu biểu mẫu
        const province = provinces.find(p => p.id === id);
        const provinceName = province?.full_name || '';
        setFormData(prev => ({ ...prev, province: provinceName }));

        // Tải danh sách phường xã khi chọn tỉnh
        if (id) {
            const wards = await getWardsByProvince(id);
            setCurrentWards(wards);
        }
    }, [provinces, getWardsByProvince]);

    const handleNext = useCallback((e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        
        // Kiểm tra dữ liệu bước 1
        if (step === 1) {
            if (!formData.name || formData.name.length < 2) {
                setError("Vui lòng nhập họ tên đầy đủ (tối thiểu 2 ký tự)");
                return;
            }
            if (!formData.email || !formData.email.includes('@')) {
                setError("Vui lòng nhập email hợp lệ");
                return;
            }
            if (!formData.password || formData.password.length < 8) {
                setError("Mật khẩu phải từ 8 ký tự trở lên");
                return;
            }
        }
        
        // Kiểm tra dữ liệu bước 2
        if (step === 2) {
            const currentYear = new Date().getFullYear();
            const year = parseInt(formData.birthYear);
            if (isNaN(year) || year < 1900 || year > currentYear) {
                setError("Năm sinh không hợp lệ");
                return;
            }
            if (!selectedWard) {
                setError("Vui lòng chọn Tỉnh/Thành và Phường/Xã");
                return;
            }
        }

        setStep(p => p + 1);
    }, [step, formData, selectedWard]);

    const handleBack = useCallback(() => {
        setError('');
        setStep(p => p - 1);
    }, []);

    const handleRegister = useCallback(async () => {
        setError('');
        setLoading(true);
        try {
            // Lấy tên đầy đủ của phường xã
            const ward = currentWards.find(w => w.id === selectedWard);
            const fullAddress = ward ? `${ward.fullName}, ${formData.province}` : formData.province;

            // Đảm bảo tên đăng nhập tối thiểu 3 ký tự
            const emailPrefix = formData.email.split('@')[0];
            const username = emailPrefix.length >= 3 ? emailPrefix : `${emailPrefix}123`.slice(0, 3);

            const res = await api.auth.register({
                username,
                email: formData.email,
                password: formData.password,
                full_name: formData.name,
                birth_year: parseInt(formData.birthYear),
                province: fullAddress, // Lưu địa chỉ đã chuẩn hóa
                interests: formData.interests,
                role: 'USER',
                created_at: new Date().toISOString()
            });

            if (res.success && res.data) {
                const token = (res.data as any).token;
                const role = (res.data as any).role;
                if (token) {
                    localStorage.setItem('token', token);
                }
                if (role) {
                    localStorage.setItem('role', role);
                }
                loginAsUser(res.data);
                navigate('/');
            } else {
                if (res.errors && typeof res.errors === 'object') {
                    const errorMsgs = Object.entries(res.errors)
                        .map(([field, msg]) => `${field}: ${msg}`)
                        .join(', ');
                    setError(`Đăng ký thất bại: ${errorMsgs}`);
                } else {
                    setError(res.message || 'Đăng ký thất bại');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    }, [formData, selectedWard, currentWards, loginAsUser, navigate]);

    const toggleInterest = useCallback((id: string) => {
        setFormData(prev => {
            if (prev.interests.includes(id)) {
                return { ...prev, interests: prev.interests.filter(i => i !== id) };
            } else {
                return { ...prev, interests: [...prev.interests, id] };
            }
        });
    }, []);

    const interestCategories = useMemo(() => INTEREST_CATEGORIES, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-3xl opacity-50" />
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary-200/20 blur-3xl opacity-50" />
            </div>

            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl relative z-10 border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Thanh tiến trình */}
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

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-650 rounded-xl text-sm font-semibold text-center animate-in fade-in duration-300">
                        ⚠️ {error}
                    </div>
                )}

                {step === 1 && (
                    <AccountStep 
                        formData={formData} 
                        setFormData={setFormData} 
                        onNext={handleNext} 
                    />
                )}
                {step === 2 && (
                    <PersonalInfoStep
                        formData={formData}
                        setFormData={setFormData}
                        selectedProvince={selectedProvince}
                        selectedWard={selectedWard}
                        setSelectedWard={setSelectedWard}
                        currentWards={currentWards}
                        provinces={provinces}
                        isLoadingAddress={isLoadingAddress}
                        addressError={addressError}
                        handleProvinceChange={handleProvinceChange}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {step === 3 && (
                    <InterestsStep
                        formData={formData}
                        interestCategories={interestCategories}
                        toggleInterest={toggleInterest}
                        onBack={handleBack}
                        onRegister={handleRegister}
                        loading={loading}
                    />
                )}

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
