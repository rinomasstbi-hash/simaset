import React, { useState, useEffect } from 'react';
import { Resource, ResourceType } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export default function AddResourceModal({ resourceToEdit, onClose }: { resourceToEdit?: Resource | null, onClose: () => void }) {
  const { addResource, updateResource } = useAppContext();
  
  const [name, setName] = useState(resourceToEdit?.name || '');
  const [type, setType] = useState<ResourceType>(resourceToEdit?.type || 'ruangan');
  const [capacity, setCapacity] = useState(resourceToEdit?.capacity || 10);
  const [description, setDescription] = useState(resourceToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState(resourceToEdit?.imageUrl || '');

  useEffect(() => {
    if (resourceToEdit) {
      setName(resourceToEdit.name);
      setType(resourceToEdit.type);
      setCapacity(resourceToEdit.capacity);
      setDescription(resourceToEdit.description || '');
      setImageUrl(resourceToEdit.imageUrl || '');
    }
  }, [resourceToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || capacity <= 0) return;

    if (resourceToEdit) {
      updateResource(resourceToEdit.id, {
        name,
        type,
        capacity,
        description,
        imageUrl,
      });
    } else {
      addResource({
        name,
        type,
        capacity,
        description,
        imageUrl,
        status: 'available',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <h3 className="font-bold text-gray-900 text-lg">{resourceToEdit ? 'Edit Aset' : 'Tambah Aset Baru'}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pb-24 overflow-y-auto flex-1 space-y-5">
          
          {/* Image Upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Foto Aset (Opsional)</label>
            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors group cursor-pointer overflow-hidden h-40">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Klik untuk upload foto</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nama Aset / Fasilitas</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Ruang Rapat Eksekutif"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Kategori</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as ResourceType)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              >
                <option value="ruangan">Ruangan</option>
                <option value="laboratorium">Laboratorium</option>
                <option value="aula">Aula</option>
                <option value="kendaraan">Kendaraan</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Kapasitas</label>
              <input 
                type="number" 
                required
                min="1"
                value={capacity}
                onChange={e => setCapacity(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Deskripsi / Fasilitas Tambahan</label>
            <textarea 
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: AC, Proyektor, Papan Tulis, dll..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none placeholder:text-gray-400"
            ></textarea>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold flex items-center justify-center py-3.5 rounded-xl transition-all shadow-sm shadow-emerald-200 mt-2 gap-2"
          >
            <Upload size={18} /> {resourceToEdit ? 'Simpan Perubahan' : 'Simpan Aset'}
          </button>
        </form>
      </div>
    </div>
  );
}
