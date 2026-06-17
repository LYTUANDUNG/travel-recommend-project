import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';
import { api } from '../../api';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Save, Loader2, Tag, Image as ImageIcon, AlignLeft, Upload, X, Map as MapIcon, ChevronLeft, Database, Clock, Info, Plus, Settings } from 'lucide-react';
import { Location } from '../../types/schema';

// Fix typical Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationSelector({ setPosition, fetchAddress }: { setPosition: (pos: [number, number]) => void, fetchAddress: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            fetchAddress(lat, lng);
        },
    });
    return null;
}

export default function AdminLocationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState<Partial<Location>>({
        name: '',
        description: '',
        address: '',
        latitude: 0,
        longitude: 0,
        category_id: null as any,
        tags: [],
        thumbnail_url: '',
        opening_hour: '08:00',
        closing_hour: '22:00',
        preview_experience: '',
        price_range_str: ''
    });

    useEffect(() => {
        api.category.getAll().then(res => {
            if (res.success) {
                setCategories(res.data);
                // Only set default if creating new (no id) and no category_id set yet
                if (res.data.length > 0 && !id && !formData.category_id) {
                    setFormData(prev => ({ ...prev, category_id: res.data[0].category_id || res.data[0].id }));
                }
            }
        }).catch(() => {
            // Fallback error handling
        });
    }, [id]);

    const fetchAddressFromNominatim = async (lat: number, lng: number) => {
        setLoadingAddress(true);
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.province || '';
                const fullAddress = data.display_name;

                setFormData(prev => ({
                    ...prev,
                    name: data.name || fullAddress.split(',')[0],
                    address: fullAddress,
                    city: city || 'Hồ Chí Minh',
                    province: city || 'Hồ Chí Minh',
                }));
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        } finally {
            setLoadingAddress(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        const files = Array.from(e.target.files);
        let newUrls: string[] = [];

        try {
            for (const file of files) {
                const res = await api.upload.image(file);
                if (res.success) {
                    newUrls.push(res.data);
                }
            }
            setUploadedImages(prev => [...prev, ...newUrls]);
            if (!formData.thumbnail_url && newUrls.length > 0) {
                setFormData(prev => ({ ...prev, thumbnail_url: newUrls[0] }));
            }
        } catch (err) {
            alert("Lỗi upload.");
        } finally {
            setUploadingImage(false);
        }
    };

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            setLoading(true);
            api.location.getById(+id).then(res => {
                if (res.success) {
                    const loc = res.data;
                    setFormData({
                        name: loc.name,
                        address: loc.address || '',
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        description: loc.description,
                        category_id: loc.category_id,
                        price_range_str: loc.price_range_str || '',
                        opening_hour: loc.opening_hour || '08:00',
                        closing_hour: loc.closing_hour || '22:00',
                        thumbnail_url: loc.thumbnail_url || '',
                        preview_experience: loc.preview_experience || ''
                    });
                    setUploadedImages(loc.images || []);
                    setPosition([loc.latitude, loc.longitude]);
                }
            }).finally(() => setLoading(false));
        }
    }, [id]);

    const handleSave = async () => {
        if (!formData.name || !formData.latitude || !formData.category_id) return alert('Vui lòng nhập tên, chọn vị trí và chọn danh mục');
        setSaving(true);
        try {
            const payload = {
                ...formData,
                images: uploadedImages
            };

            const res = isEdit 
                ? await api.location.update(+id!, payload as any)
                : await api.location.create(payload as any);

            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/admin/locations');
                }, 1000);
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (e) {
            alert('Lỗi khi lưu');
        } finally {
            setSaving(false);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...uploadedImages];
        newImages.splice(index, 1);
        setUploadedImages(newImages);
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-[500px]"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/locations')}
                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-orange-600 transition-all shadow-sm active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                             {isEdit ? 'Cập nhật địa điểm' : 'Thêm địa điểm mới'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Cung cấp thông tin chi tiết để hệ thống phân loại chính xác.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !formData.latitude}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg active:scale-95
                        ${saving || !formData.latitude ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100 dark:shadow-none'}`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? 'Lưu thay đổi' : 'Xác nhận tạo'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Col: Main Info & Images */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Basic Info Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <Info className="w-6 h-6 text-orange-500" />
                            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Thông tin cơ bản</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Tên địa điểm</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-slate-800 dark:text-white"
                                    placeholder="Nhập tên địa điểm..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Mô tả giới thiệu</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all min-h-[100px] font-medium"
                                    placeholder="Thông tin mang tính chất giới thiệu chung..."
                                />
                            </div>

                            <div className="bg-orange-50/30 dark:bg-slate-800/30 p-6 rounded-2xl border border-orange-100 dark:border-slate-700">
                                <label className="block text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 mb-3 tracking-widest flex items-center gap-2">
                                    <Database className="w-4 h-4" /> Nội dung trải nghiệm (Storytelling)
                                </label>
                                <textarea
                                    value={formData.preview_experience || ''}
                                    onChange={e => setFormData({ ...formData, preview_experience: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all min-h-[150px] font-normal text-slate-700 dark:text-slate-300"
                                    placeholder="Ví dụ: Hãy tưởng tượng bạn bắt đầu buổi sáng tại đây với tách cà phê nóng..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Danh mục</label>
                                    <select
                                        value={formData.category_id || ""}
                                        onChange={e => setFormData({ ...formData, category_id: +e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="" disabled>-- Chọn danh mục --</option>
                                        {categories.length === 0 && <option value="">Đang tải...</option>}
                                        {categories.map(c => {
                                            const catId = c.category_id || c.id;
                                            return <option key={catId} value={catId}>{c.name}</option>;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Giờ hoạt động</label>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <Clock className="w-4 h-4 text-slate-400 ml-2" />
                                        <input 
                                            type="time" 
                                            value={formData.opening_hour} 
                                            onChange={e => setFormData({...formData, opening_hour: e.target.value})}
                                            className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-full"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input 
                                            type="time" 
                                            value={formData.closing_hour}
                                            onChange={e => setFormData({...formData, closing_hour: e.target.value})}
                                            className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-full"
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Ngân sách (Theo bộ lọc)</label>
                                    <select
                                            value={formData.price_range_str || ""}
                                            onChange={e => setFormData({ ...formData, price_range_str: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="" disabled>-- Chọn mức ngân sách --</option>
                                        <option value="Miễn phí">Miễn phí</option>
                                        <option value="Dưới 100k">Dưới 100k</option>
                                        <option value="100k - 500k">100k - 500k</option>
                                        <option value="Trên 500k">Trên 500k</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-3">
                                <ImageIcon className="w-6 h-6 text-orange-500" />
                                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Thư viện hình ảnh</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{uploadedImages.length} ảnh</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {uploadedImages.map((url, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                         <button onClick={() => removeImage(idx)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-rose-500/50 transition-colors" title="Xóa ảnh"><X className="w-5 h-5" /></button>
                                         <button 
                                            onClick={() => setFormData({ ...formData, thumbnail_url: url })} 
                                            className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-emerald-500/50 transition-colors" 
                                            title="Đặt làm ảnh bìa"
                                         >
                                            <ImageIcon className="w-5 h-5" />
                                         </button>
                                    </div>
                                    {formData.thumbnail_url === url && (
                                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1">
                                            <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                            Ảnh bìa
                                        </div>
                                    )}
                                </div>
                            ))}

                            <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-400 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 group">
                                {uploadingImage ? (
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-6 h-6 text-slate-400 mb-2" />
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tải lên</span>
                                    </>
                                )}
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Col: Map & Location */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Map Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                             <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm flex items-center gap-2">
                                <MapIcon className="w-4 h-4 text-orange-500" /> Xác định vị trí GIS
                            </h3>
                            {loadingAddress && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
                        </div>
                        <div className="h-[350px] relative pointer-events-auto">
                            <MapContainer 
                                center={[10.762622, 106.660172]} 
                                zoom={14} 
                                style={{ height: '100%', width: '100%' }}
                                className="z-0"
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationSelector setPosition={setPosition} fetchAddress={fetchAddressFromNominatim} />
                                {position && <Marker position={position} />}
                            </MapContainer>
                            <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Click để chọn vị trí
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Địa chỉ được xác định</label>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 leading-relaxed">
                                    {formData.address || "Click trên bản đồ để chọn địa chỉ..."}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kinh độ</p>
                                    <p className="font-mono font-bold text-orange-600 truncate">{formData.longitude?.toFixed(6) || "---"}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vĩ độ</p>
                                    <p className="font-mono font-bold text-orange-600 truncate">{formData.latitude?.toFixed(6) || "---"}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Tags Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Tag className="w-6 h-6 text-orange-500" />
                            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Định danh Tags</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Nhập các đặc điểm cách nhau bởi dấu phẩy. Thông tin này sẽ được lưu vào cơ sở dữ liệu để AI phân tích.</p>
                        <input
                            type="text"
                            value={formData.tags?.map(t => t.name).join(', ') || ''}
                            onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => ({ tag_id: 0, name: t.trim(), weight: 1 })) })}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-orange-600"
                            placeholder="thiên nhiên, cổ kính, yên tĩnh..."
                        />
                    </div>
                </div>
            </div>

            {success && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-3xl font-bold uppercase tracking-widest text-xs shadow-2xl flex items-center gap-3 animate-bounce">
                    <Database className="w-5 h-5" />
                    Thao tác xử lý thành công!
                </div>
            )}
        </div>
    );
}
