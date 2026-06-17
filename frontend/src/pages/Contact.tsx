import { useState, useEffect } from 'react';
import { 
    Mail, 
    Phone, 
    MapPin, 
    Send, 
    CheckCircle2, 
    Github, 
    Linkedin,
    Globe,
    MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';

interface TeamMember {
    name: string;
    role: string;
    avatar: string;
    bio: string;
    github?: string;
    linkedin?: string;
    website?: string;
}

export default function Contact() {
    const { user, isAuthenticated } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                name: user.full_name || '',
                email: user.email || ''
            }));
        }
    }, [isAuthenticated, user]);

    const teamMembers: TeamMember[] = [
        {
            name: "Lý Tuấn Dũng",
            role: "Sinh viên thực hiện",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3270&auto=format&fit=crop",
            bio: "Khoa Công nghệ thông tin, Đại học Nông Lâm TPHCM. Chịu trách nhiệm thiết kế hệ thống gợi ý, phát triển toàn diện ứng dụng và tích hợp giải pháp bản đồ GIS.",
            github: "https://github.com",
            linkedin: "https://linkedin.com"
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        
        try {
            const res = await api.auth.contactEmail(
                formData.name,
                formData.email,
                formData.subject,
                formData.message
            );
            if (res.success) {
                setIsSubmitted(true);
                setFormData(prev => ({ ...prev, subject: '', message: '' }));
            } else {
                setError(res.message || 'Có lỗi xảy ra khi gửi tin nhắn.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-16 font-sans pb-16">
            {/* Banner Header */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 h-[220px] flex items-center p-8 md:p-12 shadow-xl">
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-40"
                        alt="Contact Banner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-wider mb-4">
                        <MessageSquare className="w-3 h-3 text-orange-500" /> Liên hệ hỗ trợ
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
                        Đội ngũ & <span className="text-orange-500">Liên hệ.</span>
                    </h1>
                    <p className="text-sm text-slate-350 font-semibold max-w-xl">
                        Tìm hiểu thêm về đội ngũ phát triển VinaTravel hoặc gửi câu hỏi phản hồi để chúng tôi nâng cấp hệ thống ngày một tốt hơn.
                    </p>
                </div>
            </div>

            {/* Team Showcase */}
            <section className="space-y-8">
                <div className="text-center max-w-xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">Đội Ngũ Sáng Lập</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">
                        Những thành viên chịu trách nhiệm chính trong việc thiết kế, xây dựng và nghiên cứu hệ thống gợi ý du lịch VinaTravel.
                    </p>
                </div>

                <div className="flex justify-center">
                    {teamMembers.map((member, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group max-w-md w-full"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="w-24 h-24 rounded-3xl overflow-hidden mb-5 border-2 border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-105 transition-transform duration-350">
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            </div>

                            <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">{member.name}</h3>
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full mb-4">
                                {member.role}
                            </span>
                            
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mb-6 flex-1">
                                {member.bio}
                            </p>

                            <div className="flex gap-3">
                                {member.github && (
                                    <a href={member.github} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                        <Github className="w-4 h-4" />
                                    </a>
                                )}
                                {member.linkedin && (
                                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Split Contact Form and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Contact Info (5 Columns) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">Thông Tin Liên Hệ</h3>
                            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">Mọi thắc mắc và đóng góp ý kiến vui lòng liên hệ:</p>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Địa chỉ Email</span>
                                     <a href="mailto:lydung853@gmail.com" className="text-xs font-bold text-slate-750 dark:text-slate-200 hover:text-orange-500 transition-colors">
                                         lydung853@gmail.com
                                     </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Điện thoại Hotline</span>
                                    <a href="tel:+84123456789" className="text-xs font-bold text-slate-750 dark:text-slate-200 hover:text-orange-500 transition-colors">
                                        +84 (0) 123 456 789
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Trụ sở nghiên cứu</span>
                                     <span className="text-xs font-bold text-slate-750 dark:text-slate-200">
                                         Khu phố 6, Linh Trung, Tp. Thủ Đức, Tp. Hồ Chí Minh, Việt Nam
                                     </span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">Tìm kiếm chúng tôi trên</span>
                            <div className="flex gap-2">
                                <a href="https://github.com" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                                    <Github className="w-4.5 h-4.5" />
                                </a>
                                <a href="https://linkedin.com" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                                    <Linkedin className="w-4.5 h-4.5" />
                                </a>
                                <a href="https://vinatravel.vn" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                                    <Globe className="w-4.5 h-4.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form (7 Columns) */}
                <div className="lg:col-span-7">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                        {isSubmitted ? (
                            <div className="text-center py-12 space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">Gửi lời nhắn thành công!</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-semibold leading-relaxed">
                                    Cảm ơn bạn đã phản hồi thông tin. Đội ngũ kỹ thuật của VinaTravel sẽ tiếp nhận thông tin phản hồi của bạn sớm nhất.
                                </p>
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition duration-300"
                                >
                                    Gửi lời nhắn khác
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">Gửi Lời Nhắn Trực Tiếp</h3>
                                    <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">Chúng tôi sẽ cố gắng phản hồi lại bạn trong vòng 24 giờ làm việc.</p>
                                </div>

                                {error && (
                                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl border border-rose-100 dark:border-rose-900/50">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                            Họ và tên <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nguyễn Văn A"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                            Địa chỉ Email <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="username@gmail.com"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Tiêu đề liên hệ</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Ví dụ: Đóng góp ý kiến thuật toán gợi ý, Báo lỗi giao diện..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                        Nội dung tin nhắn <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={5}
                                        required
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Nhập nội dung lời nhắn hoặc câu hỏi của bạn tại đây..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-orange-500/10 active:scale-[0.98] transition-all"
                                >
                                    {isSubmitting ? (
                                        <>Gửi tin nhắn...</>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" /> Gửi lời nhắn
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
