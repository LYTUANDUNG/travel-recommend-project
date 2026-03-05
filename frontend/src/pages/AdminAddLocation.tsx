import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';
import { api } from '../api';
import { MapPin, Save, Loader2, Tag, Image as ImageIcon, AlignLeft, Upload, X } from 'lucide-react';
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
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Upload state (Mocking 3rd party like Cloudinary)
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState<Partial<Location>>({
        name: '',
        description: '',
        address: '',
        latitude: 0,
        longitude: 0,
        category_name: 'Di tích lịch sử',
        tags: [],
        thumbnail_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f0a?auto=format&fit=crop&q=80',
    });

    // Reverse Geocoding with OpenStreetMap Nominatim
    const fetchAddressFromNominatim = async (lat: number, lng: number) => {
        setLoadingAddress(true);
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            if (data && data.address) {
                const addr = data.address;
                const street = addr.road || addr.pedestrian || '';
                const suburb = addr.suburb || addr.quarter || '';
                const city = addr.city || addr.town || addr.province || '';

                let newName = data.name || '';
                if (!newName && street) newName = street;

                const fullAddress = data.display_name;

                setFormData(prev => ({
                    ...prev,
                    name: newName || fullAddress.split(',')[0], // Reset name based on new click strictly
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        // Simulate uploading to a 3rd party service (e.g. Cloudinary / ImgBB)
        setTimeout(() => {
            const newUrls = Array.from(e.target.files!).map(file => URL.createObjectURL(file));
            setUploadedImages(prev => [...prev, ...newUrls]);

            // Sync with DB schema
            if (!formData.thumbnail_url && newUrls.length > 0) {
                setFormData(prev => ({ ...prev, thumbnail_url: newUrls[0] }));
            }
            // If the DB supported multiple images, we would also set an `images_json` field here
            setUploadingImage(false);
        }, 1500);
    };

    const removeImage = (index: number) => {
        const newImages = [...uploadedImages];
        newImages.splice(index, 1);
        setUploadedImages(newImages);
        if (index === 0) {
            setFormData(prev => ({ ...prev, thumbnail_url: newImages[0] || '' }));
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.latitude) return alert('Vui lòng chọn địa điểm trên bản đồ và nhập tên');
        setSaving(true);
        try {
            const res = await api.location.create(formData);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                // Reset maybe
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (e) {
            alert('Lỗi khi lưu');
        } finally {
            setSaving(false);
        }
    };

    const categories = ['Di tích lịch sử', 'Ẩm thực', 'Du lịch sinh thái', 'Khách sạn', 'Giải trí', 'Mua sắm'];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">Thêm Địa Điểm (Admin)</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">Click trực tiếp vào bản đồ để lấy toạ độ và địa chỉ tự động</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Side: Map */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Bản đồ định vị (Leaflet + Nominatim)
                        </h3>
                    </div>
                    <div className="flex-1 relative">
                        <MapContainer
                            center={[10.762622, 106.660172] as LatLngExpression}
                            zoom={14}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationSelector setPosition={setPosition} fetchAddress={fetchAddressFromNominatim} />
                            {position && <Marker position={position} />}
                        </MapContainer>

                        {loadingAddress && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-indigo-100 dark:border-indigo-900 flex items-center gap-2 z-[1000] text-sm font-medium text-indigo-700 dark:text-indigo-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang nội suy địa chỉ...
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
                    <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100 mb-6">Thông tin địa điểm</h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vĩ độ (Lat)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={formData.latitude || ''}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-sm"
                                    placeholder="Click bản đồ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kinh độ (Lng)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={formData.longitude || ''}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-sm"
                                    placeholder="Click bản đồ"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tên địa điểm</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:text-white"
                                    placeholder="VD: Dinh Độc Lập"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Địa chỉ chi tiết (Reverse Geocoding)</label>
                            <textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:text-white"
                                rows={2}
                                placeholder="Địa chỉ nội suy từ bản đồ..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Danh mục (Category) - Labeling</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Tag className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select
                                        value={formData.category_name}
                                        onChange={e => setFormData({ ...formData, category_name: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none dark:text-white"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags (Ngăn cách bởi dấu phẩy)</label>
                                <input
                                    type="text"
                                    onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => ({ tag_id: 0, name: t.trim(), weight: 1 })) })}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:text-white"
                                    placeholder="gia đình, thiên nhiên"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mô tả</label>
                            <div className="relative">
                                <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                                    <AlignLeft className="h-5 w-5 text-slate-400" />
                                </div>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:text-white"
                                    rows={3}
                                    placeholder="Mô tả về địa điểm..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Thư viện ảnh (Upload lên Cloudinary/S3)</label>

                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                                {uploadedImages.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                        <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {idx === 0 && (
                                            <span className="absolute bottom-1 left-1 bg-indigo-600 border border-white text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">Thumb</span>
                                        )}
                                    </div>
                                ))}

                                <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                    {uploadingImage ? (
                                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-slate-400" />
                                            <span className="text-xs text-slate-500 mt-2 font-medium">Chọn ảnh</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400">Ảnh đầu tiên sẽ được chọn làm ảnh đại diện chính (Thumbnail).</p>
                        </div>

                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        {success ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lưu thành công vào DB!
                            </span>
                        ) : <span></span>}

                        <button
                            onClick={handleSave}
                            disabled={saving || !formData.latitude}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-white shadow-lg shadow-indigo-200 transition-all
                ${saving || !formData.latitude ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5'}`}
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu Địa Điểm (DB)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
