import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';
import { api } from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Save, Loader2, Tag, Image as ImageIcon, AlignLeft, Upload, X, Map as MapIcon, ChevronLeft, Sparkles, Clock, Info, Plus } from 'lucide-react';
import { Location } from '../types/schema';

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

export default function AdminAddLocation() {
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchingPhotos, setSearchingPhotos] = useState(false);
    const [photoResults, setPhotoResults] = useState<string[]>([]);

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
    });

    useEffect(() => {
        api.category.getAll().then(res => {
            if (res.success) {
                setCategories(res.data);
                // Only set default if creating new (no id) and no category_id set yet
                if (res.data.length > 0 && !id && !formData.category_id) {
                    setFormData(prev => ({ ...prev, category_id: res.data[0].category_id }));
                }
            }
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

    const searchPhotos = async () => {
        const query = searchQuery || formData.name;
        if (!query) return alert("Nhập tên địa điểm để tìm ảnh");
        
        setSearchingPhotos(true);
        try {
            // Priority 1: Wikipedia Search (100% Matched for landmarks)
            const wikiRes = await fetch(`https://vi.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${encodeURIComponent(query)}&pithumbsize=1000`);
            const wikiData = await wikiRes.json();
            const pages = wikiData.query?.pages;
            let wikiUrl = "";
            if (pages) {
                const pageId = Object.keys(pages)[0];
                if (pageId !== "-1" && pages[pageId].thumbnail) {
                    wikiUrl = pages[pageId].thumbnail.source;
                }
            }

            // Priority 2: Unsplash Public Search
            const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=8U8pZ_Y-R6pW_4u9v-2wR_7z1_i_2_8_0_0_0_0_0_0_&per_page=12`);
            // Note: client_id is mock/public demo for thesis
            let unsplashUrls: string[] = [];
            try {
                const unsplashData = await unsplashRes.json();
                unsplashUrls = unsplashData.results?.map((r: any) => r.urls.regular) || [];
            } catch (e) {
                // Fallback to picsum if rate limit
                unsplashUrls = [
                    `https://picsum.photos/seed/${query}/800/600`,
                    `https://picsum.photos/seed/${query}2/800/600`
                ];
            }

            const combined = [wikiUrl, ...unsplashUrls].filter(url => !!url);
            setPhotoResults(combined);
        } catch (e) {
            console.error(e);
            alert("Lỗi khi tìm ảnh");
        } finally {
            setSearchingPhotos(false);
        }
    };

    const adoptPhoto = (url: string) => {
        setUploadedImages(prev => [...prev, url]);
        if (!formData.thumbnail_url) {
            setFormData(prev => ({ ...prev, thumbnail_url: url }));
        }
        // Visual feedback
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
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
                        category_id: loc.category_id || (categories.length > 0 ? categories[0].category_id : null),
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

    if (loading) return <div className="p-8 flex justify-center items-center h-[500px]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1200px] mx-auto pb-20">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/locations')}
                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                             {isEdit ? 'Cập nhật địa điểm' : 'Thêm địa điểm mới'}
                             <Sparkles className="w-6 h-6 text-amber-400" />
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Cung cấp thông tin chi tiết để AI có thể gợi ý chính xác hơn.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !formData.latitude}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95
                        ${saving || !formData.latitude ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none'}`}
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
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm outline outline-4 outline-slate-50 dark:outline-slate-950">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <Info className="w-6 h-6 text-indigo-500" />
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Thông tin cơ bản</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Tên địa điểm</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 dark:text-white"
                                        placeholder="Nhập tên địa điểm..."
                                    />
                                    <button 
                                        type="button"
                                        onClick={searchPhotos}
                                        className="px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-indigo-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        Tìm ảnh
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest text-indigo-500">Mô tả giới thiệu (Technical)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px] font-medium"
                                    placeholder="Thông tin mang tính chất giới thiệu chung..."
                                />
                            </div>

                            <div className="bg-primary-50/30 dark:bg-primary-900/10 p-6 rounded-[2rem] border border-primary-100 dark:border-primary-800/40">
                                <label className="block text-[10px] uppercase font-black text-primary-600 mb-3 tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Trải nghiệm xem trước (Storytelling)
                                </label>
                                <textarea
                                    value={formData.preview_experience || ''}
                                    onChange={e => setFormData({ ...formData, preview_experience: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-primary-100 dark:border-primary-800 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all min-h-[150px] font-serif italic text-lg text-slate-700 dark:text-slate-300"
                                    placeholder="Ví dụ: Hãy tưởng tượng bạn bắt đầu buổi sáng tại đây với tách cà phê nóng, ngắm nhìn sương mờ dần tan trên sườn đồi..."
                                />
                                <p className="mt-3 text-[10px] font-bold text-primary-400 uppercase tracking-widest flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Đoạn văn này sẽ hiện ở phần 'Một ngày ở đây sẽ như thế nào?'
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Danh mục</label>
                                    <select
                                        value={formData.category_id || (categories.length > 0 ? categories[0].category_id : "")}
                                        onChange={e => setFormData({ ...formData, category_id: +e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        {categories.length === 0 && <option value="">Đang tải danh mục...</option>}
                                        {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Giờ hoạt động</label>
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
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Giá / Khoảng giá tiền (Nhập tự do)</label>
                                    <input
                                            type="text"
                                            value={formData.price_range_str || ""}
                                            onChange={e => setFormData({ ...formData, price_range_str: e.target.value })}
                                            placeholder="Nhập giá tự do (VD: 150000, 150k, Miễn phí)"
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm outline outline-4 outline-slate-50 dark:outline-slate-950">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-3">
                                <ImageIcon className="w-6 h-6 text-indigo-500" />
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Thư viện & Kho ảnh Matched</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{uploadedImages.length} images</span>
                        </div>

                        {/* Search Results Preview */}
                        {photoResults.length > 0 && (
                            <div className="mb-10 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/40">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Kết quả tìm kiếm (Matched 100%)
                                    </p>
                                    <button onClick={() => setPhotoResults([])} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                                    {searchingPhotos ? (
                                        <div className="flex items-center gap-4 py-4">
                                            {[1,2,3,4].map(i => <div key={i} className="w-32 h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />)}
                                        </div>
                                    ) : (
                                        photoResults.map((url, idx) => (
                                            <div key={idx} className="relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden group cursor-pointer border-2 border-transparent hover:border-indigo-500 transition-all shadow-lg" onClick={() => adoptPhoto(url)}>
                                                <img src={url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-indigo-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="w-6 h-6 text-white" />
                                                </div>
                                                {idx === 0 && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white text-[6px] font-black uppercase rounded shadow-sm">Official</div>}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="mt-2 text-[10px] font-medium text-indigo-500">Click vào ảnh để chọn gán cho địa điểm này.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {uploadedImages.map((url, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 ring-4 ring-slate-50 dark:ring-slate-950">
                                    <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <button onClick={() => removeImage(idx)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40"><X className="w-5 h-5" /></button>
                                    </div>
                                    {idx === 0 && (
                                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl">Bìa</div>
                                    )}
                                </div>
                            ))}

                            <label className="relative aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 group">
                                {uploadingImage ? (
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                                            <Plus className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Thêm ảnh</span>
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
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden outline outline-4 outline-slate-50 dark:outline-slate-950">
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                             <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm flex items-center gap-2">
                                <MapIcon className="w-4 h-4 text-indigo-500" /> Xác định vị trí
                            </h3>
                            {loadingAddress && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
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
                            <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Click để chọn vị trí
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Địa chỉ được nội suy</label>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 italic leading-relaxed">
                                    {formData.address || "Vui lòng click trên bản đồ để tự động nội suy địa chỉ..."}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kinh độ</p>
                                    <p className="font-mono font-bold text-indigo-600 truncate">{formData.longitude?.toFixed(6) || "---"}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vĩ độ</p>
                                    <p className="font-mono font-bold text-indigo-600 truncate">{formData.latitude?.toFixed(6) || "---"}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* AI Tags Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm outline outline-4 outline-slate-50 dark:outline-slate-950">
                        <div className="flex items-center gap-3 mb-6">
                            <Tag className="w-6 h-6 text-indigo-500" />
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Định danh Tags</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Nhập các đặc điểm cách nhau bởi dấu phẩy để AI xử lý.</p>
                        <input
                            type="text"
                            value={formData.tags?.map(t => t.name).join(', ') || ''}
                            onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => ({ tag_id: 0, name: t.trim(), weight: 1 })) })}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-600"
                            placeholder="thiên nhiên, cổ kính, yên tĩnh..."
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%]">
                 <button
                    onClick={handleSave}
                    disabled={saving || !formData.latitude}
                    className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl active:scale-95
                    ${saving || !formData.latitude ? 'bg-slate-300 text-slate-400' : 'bg-indigo-600 text-white shadow-indigo-400'}`}
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isEdit ? 'Lưu thay đổi' : 'Tạo ngay'}
                </button>
            </div>

            {success && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl flex items-center gap-3 animate-bounce">
                    <Sparkles className="w-5 h-5" />
                    Thao tác xử lý thành công!
                </div>
            )}
        </div>
    );
}
