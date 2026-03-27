import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Search, Package, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Categories must match DB enum: 'Makanan', 'Jasa', 'Barang'
const CATEGORIES = ['Makanan', 'Jasa', 'Barang'];

const defaultForm = {
    name: '',
    category: 'Makanan',
    price: '',
    description: '',
    condition_status: 'Baru',
    open_time: '',
    close_time: ''
};

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProductId, setCurrentProductId] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [productToDelete, setProductToDelete] = useState(null);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/merchant/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching merchant products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleOpenModal = (product = null) => {
        setImageFile(null);
        if (product) {
            setIsEditing(true);
            setCurrentProductId(product.id);
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                description: product.description || '',
                condition_status: product.condition_status || 'Baru',
                open_time: product.open_time ? product.open_time.substring(0, 5) : '',
                close_time: product.close_time ? product.close_time.substring(0, 5) : ''
            });
            setImagePreview(product.image_url ? `${product.image_url}` : null);
        } else {
            setIsEditing(false);
            setCurrentProductId(null);
            setFormData(defaultForm);
            setImagePreview(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const validate = () => {
        if (!formData.name.trim()) { toast.error('Nama produk wajib diisi.'); return false; }
        if (!formData.price || Number(formData.price) <= 0) { toast.error('Harga wajib diisi dengan nilai lebih dari 0.'); return false; }
        if (!formData.description.trim()) { toast.error('Deskripsi produk wajib diisi.'); return false; }
        if (!isEditing && !imageFile) { toast.error('Foto produk wajib diunggah.'); return false; }
        
        if (formData.category === 'Makanan') {
            if (!formData.open_time) { toast.error('Jam buka wajib diisi untuk kategori Makanan.'); return false; }
            if (!formData.close_time) { toast.error('Jam tutup wajib diisi untuk kategori Makanan.'); return false; }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        const toastId = toast.loading(isEditing ? 'Menyimpan perubahan...' : 'Menambahkan produk...');
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('category', formData.category);
            payload.append('price', parseInt(formData.price, 10));
            payload.append('description', formData.description);

            if (formData.category === 'Barang') {
                payload.append('condition_status', formData.condition_status);
            }
            if (formData.category === 'Makanan') {
                payload.append('open_time', formData.open_time);
                payload.append('close_time', formData.close_time);
            }
            if (imageFile) {
                payload.append('image', imageFile);
            }

            if (isEditing) {
                await api.put(`/merchant/products/${currentProductId}`, payload);
                toast.success('Produk berhasil diperbarui!', { id: toastId });
            } else {
                await api.post('/merchant/products', payload);
                toast.success('Produk berhasil ditambahkan!', { id: toastId });
            }
            fetchProducts();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Gagal menyimpan produk: ' + (error.response?.data?.message || error.message), { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (product) => {
        const newStatus = !product.is_active;
        const toastId = toast.loading(newStatus ? 'Mengaktifkan...' : 'Menonaktifkan...');
        try {
            await api.put(`/merchant/products/${product.id}/status`, { is_active: newStatus });
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
            toast.success(`Produk ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, { id: toastId });
        } catch (error) {
            toast.error('Gagal mengubah status produk', { id: toastId });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isBarang = formData.category === 'Barang';
    const isMakanan = formData.category === 'Makanan';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-green transition-all shadow-sm outline-none"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-green text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-green/80 shadow-lg shadow-brand-green/20"
                >
                    <Plus size={18} /> Tambah Produk
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-3xl border border-gray-100 p-6 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 shrink-0 bg-brand-cream rounded-2xl flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                    <img src={`${product.image_url}`} alt={product.name} className={`w-full h-full object-cover ${!product.is_active ? 'grayscale opacity-50' : ''}`} />
                                ) : (
                                    <Package className={`w-8 h-8 ${!product.is_active ? 'text-gray-300' : 'text-brand-orange'}`} />
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className={`font-black truncate ${!product.is_active ? 'text-gray-400' : 'text-brand-dark-blue'}`}>{product.name}</h3>
                                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mt-0.5">{product.category}</p>
                                <p className={`text-sm font-bold mt-1 ${!product.is_active ? 'text-gray-300' : 'text-brand-green'}`}>Rp {(product.price || 0).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        {!product.is_active && (
                            <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                                <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Nonaktif</span>
                            </div>
                        )}
                        <div className="mt-6 flex items-center gap-2">
                            <button
                                onClick={() => handleToggleStatus(product)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    product.is_active 
                                    ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' 
                                    : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                                }`}
                                title={product.is_active ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                            >
                                {product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                                onClick={() => handleOpenModal(product)}
                                className="w-10 flex items-center justify-center py-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-brand-dark-blue hover:text-white transition-all shadow-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => setProductToDelete(product)}
                                className="w-10 flex items-center justify-center py-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <Package className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-sm font-bold text-gray-400">Belum ada produk. Mulai berjualan sekarang!</p>
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit Produk */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-brand-dark-blue/40 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">

                        {/* Kiri: Foto */}
                        <div className="w-full md:w-[40%] bg-gray-50 p-8 border-r border-gray-100 flex flex-col">
                            <h2 className="text-xl font-black text-brand-dark-blue mb-8">
                                {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
                            </h2>
                            <div className="flex-1 flex flex-col justify-center">
                                <label className="block text-xs font-bold text-gray-500 mb-3 ml-1">Foto Produk</label>
                                <div className="w-full aspect-square bg-white border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden mb-4 relative group transition-colors hover:border-brand-green/50">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-brand-green transition-colors">
                                                <Package className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-500">Belum ada foto</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Pilih unggah gambar</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-brand-dark-blue/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                        <label className="cursor-pointer bg-white text-brand-dark-blue px-6 py-2.5 rounded-xl text-sm font-black hover:scale-105 transition-transform shadow-lg">
                                            <span>{imagePreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                                            <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider">Maks. 2MB. Format: JPG, PNG.</p>
                            </div>
                        </div>

                        {/* Kanan: Form */}
                        <div className="w-full md:w-[60%] flex flex-col bg-white">
                            <div className="flex items-center justify-end p-4">
                                <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 hover:rotate-90 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="px-8 pb-8 pt-2 flex-1 overflow-y-auto">
                                <form id="productForm" onSubmit={handleSubmit} className="space-y-5">

                                    {/* Nama */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Nama Produk <span className="text-red-400">*</span></label>
                                        <input
                                            type="text" name="name" value={formData.name} onChange={handleChange}
                                            placeholder={
                                                formData.category === 'Makanan' ? 'Contoh: Nasi Goreng Spesial' :
                                                formData.category === 'Jasa' ? 'Contoh: Jasa Pangkas Rambut' :
                                                'Contoh: Sepatu Sneaker Original'
                                            }
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-brand-green outline-none text-sm transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* Harga + Kategori */}
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Harga (Rp) <span className="text-red-400">*</span></label>
                                            <input
                                                type="number" name="price" value={formData.price} onChange={handleChange}
                                                placeholder={
                                                    formData.category === 'Makanan' ? '15000' :
                                                    formData.category === 'Jasa' ? '30000' :
                                                    '250000'
                                                }
                                                min="1"
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-brand-green outline-none text-sm transition-all shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Kategori <span className="text-red-400">*</span></label>
                                            <select
                                                name="category" value={formData.category} onChange={handleChange}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-brand-green outline-none text-sm transition-all shadow-sm appearance-none cursor-pointer"
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Jam Operasional — hanya Makanan */}
                                    {isMakanan && (
                                        <div className="grid grid-cols-2 gap-5 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                            <div className="col-span-2">
                                                <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-1.5">
                                                    ⏰ Jam Operasional <span className="text-red-400">*</span>
                                                </h4>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Jam Buka</label>
                                                <input
                                                    type="time" name="open_time" value={formData.open_time} onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-brand-orange/30 outline-none text-sm transition-all shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Jam Tutup</label>
                                                <input
                                                    type="time" name="close_time" value={formData.close_time} onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-brand-orange/30 outline-none text-sm transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Kondisi — hanya Barang */}
                                    {isBarang && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Kondisi Barang <span className="text-red-400">*</span></label>
                                            <div className="flex gap-4">
                                                <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${formData.condition_status === 'Baru' ? 'border-brand-green/30 bg-brand-green/5' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                                                    <input type="radio" name="condition_status" value="Baru" checked={formData.condition_status === 'Baru'} onChange={handleChange} className="text-brand-green w-4 h-4" />
                                                    <span className="text-sm font-black text-gray-700">Baru</span>
                                                </label>
                                                <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${formData.condition_status === 'Bekas' ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                                                    <input type="radio" name="condition_status" value="Bekas" checked={formData.condition_status === 'Bekas'} onChange={handleChange} className="text-brand-orange w-4 h-4" />
                                                    <span className="text-sm font-black text-gray-700">Bekas</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Deskripsi */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Deskripsi Produk <span className="text-red-400">*</span></label>
                                        <textarea
                                            name="description" value={formData.description} onChange={handleChange}
                                            rows="4" 
                                            placeholder={
                                                formData.category === 'Makanan' ? 'Tuliskan detail rasa, porsi, bungkus (pedas/sedang), dll...' :
                                                formData.category === 'Jasa' ? 'Tuliskan keahlian, durasi pengerjaan, alat yang dibawa, dll...' :
                                                'Tuliskan spesifikasi, bahan, ukuran, kondisi fisik, dll...'
                                            }
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-brand-green outline-none text-sm resize-none transition-all shadow-sm leading-relaxed"
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button onClick={handleCloseModal} className="px-6 py-3 rounded-xl font-extrabold text-gray-500 hover:bg-gray-100 transition-colors text-xs uppercase tracking-widest">
                                    Batal
                                </button>
                                <button
                                    type="submit" form="productForm" disabled={saving}
                                    className={`px-8 py-3 rounded-xl font-extrabold text-white text-xs uppercase tracking-widest transition-all ${saving ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand-green hover:bg-[#124429] shadow-[0_8px_20px_-6px_rgba(25,108,61,0.5)] hover:-translate-y-0.5 active:translate-y-0'}`}
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Produk'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            , document.body)}

            {/* Modal Konfirmasi Hapus */}
            {productToDelete && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-brand-dark-blue/40 backdrop-blur-sm" onClick={() => setProductToDelete(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-brand-dark-blue mb-2">Hapus Produk?</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8">
                            Anda yakin ingin menghapus <strong>{productToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setProductToDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm">
                                Batal
                            </button>
                            <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors text-sm shadow-lg shadow-red-500/20">
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default ProductManagement;
