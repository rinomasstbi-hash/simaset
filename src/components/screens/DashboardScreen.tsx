import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Resource, ResourceType } from '../../types';
import { Search, Building2, FlaskConical, CarFront, Landmark, MapPin, Users, LogOut, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import BookingModal from '../shared/BookingModal';
import AddResourceModal from '../shared/AddResourceModal';
import type { TabType } from '../layout/AppLayout';

export default function DashboardScreen({ onNavigate }: { onNavigate: (tab: TabType) => void }) {
  const { resources, deleteResource, updateResourceStatus, notifications, currentUser, logout, openLogin } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<{id: string, name: string} | null>(null);

  const categories = [
    { id: 'all', label: 'Semua', icon: Building2 },
    { id: 'ruangan', label: 'Ruangan', icon: Building2 },
    { id: 'laboratorium', label: 'Lab', icon: FlaskConical },
    { id: 'aula', label: 'Aula', icon: Landmark },
    { id: 'kendaraan', label: 'Kendaraan', icon: CarFront },
  ];

  const filteredResources = resources.filter(r => {
    const matchesCat = activeCategory === 'all' || r.type === activeCategory;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const unreadCount = currentUser ? notifications.filter(n => !n.read).length : 0;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canManage = isAdmin || isManager;

  const handleResourceClick = (resource: Resource) => {
    if (!currentUser) {
      openLogin();
    } else {
      setSelectedResource(resource);
    }
  };

  const confirmDelete = () => {
    if (resourceToDelete) {
      deleteResource(resourceToDelete.id);
      setResourceToDelete(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Header section with gradient */}
      <div className="bg-emerald-600 px-5 pt-8 pb-24 relative">
        <div className="flex justify-between items-start mb-6">
          {currentUser ? (
            <div>
              <p className="text-emerald-200 text-sm font-medium mb-1">Halo, Selamat Pagi</p>
              <h1 className="text-white text-2xl font-bold leading-tight">{currentUser.name}</h1>
            </div>
          ) : (
            <div>
              <p className="text-emerald-200 text-xs font-medium mb-1">Selamat Datang di</p>
              <h1 className="text-white text-xl font-bold leading-tight">SIMASET-MTsN 4</h1>
            </div>
          )}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <button 
                  onClick={logout}
                  className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                </button>
                <button 
                  onClick={() => onNavigate('notifications')}
                  className="w-10 h-10 bg-emerald-500/50 hover:bg-emerald-500 rounded-full flex items-center justify-center relative transition-colors"
                >
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=10b981&color=fff&rounded=true&bold=true`} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" 
                  />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-emerald-600 rounded-full"></span>
                  )}
                </button>
              </>
            ) : (
              <button 
                onClick={openLogin}
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors backdrop-blur-sm"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari ruangan atau kendaraan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
          />
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 border border-white/10 shadow-sm backdrop-blur-sm"
          >
            <Plus size={18} /> Tambah Aset Fasilitas
          </button>
        )}
      </div>

      {/* Main Content Area overlapping the header */}
      <div className="px-5 -mt-10 relative z-10 flex-1 flex flex-col">
        
        {/* Categories */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className="flex flex-col items-center space-y-2"
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                activeCategory === cat.id 
                  ? "bg-emerald-100 text-emerald-600" 
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}>
                <cat.icon size={22} strokeWidth={2.5} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-colors",
                activeCategory === cat.id ? "text-emerald-600" : "text-gray-500"
              )}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Resource List */}
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {canManage ? 'Daftar Fasilitas' : 'Rekomendasi'}
          </h2>
          <button className="text-sm text-emerald-600 font-medium hover:underline">Lihat Semua</button>
        </div>

        <div className="space-y-4 pb-6">
          {filteredResources.map(resource => {
            const canManageThisResource = isAdmin || (isManager && currentUser?.managedResourceIds?.includes(resource.id));
            return (
              <ResourceCard 
                key={resource.id} 
                resource={resource} 
                onClick={() => handleResourceClick(resource)} 
                isAdmin={isAdmin}
                canManageThisResource={canManageThisResource}
                onDelete={() => setResourceToDelete({ id: resource.id, name: resource.name })}
                onUpdateStatus={(status) => updateResourceStatus(resource.id, status)}
              />
            );
          })}
          {filteredResources.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">Tidak ada fasilitas yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {selectedResource && (
        <BookingModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}
      
      {isAddModalOpen && (
        <AddResourceModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {resourceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Hapus Aset Fasilitas</h3>
            <p className="text-sm text-gray-500 mb-6">Apakah Anda yakin ingin menghapus "{resourceToDelete.name}"? Aset yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setResourceToDelete(null)} 
                className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 bg-gray-50 font-semibold text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-2.5 rounded-xl text-white hover:bg-rose-700 bg-rose-600 font-semibold text-sm transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ 
  resource, 
  onClick, 
  isAdmin, 
  canManageThisResource,
  onDelete,
  onUpdateStatus 
}: { 
  key?: string | number; 
  resource: Resource; 
  onClick: () => void; 
  isAdmin: boolean; 
  canManageThisResource?: boolean;
  onDelete: () => void;
  onUpdateStatus?: (status: Resource['status']) => void;
}) {
  const isVehicle = resource.type === 'kendaraan';
  
  const statusColors = {
    'available': 'bg-emerald-100 text-emerald-700',
    'in-use': 'bg-amber-100 text-amber-700',
    'maintenance': 'bg-rose-100 text-rose-700',
  };

  const statusText = {
    'available': 'Tersedia',
    'in-use': 'Sedang Digunakan',
    'maintenance': 'Pemeliharaan',
  };

  return (
    <div 
      onClick={resource.status !== 'maintenance' ? onClick : undefined}
      className={cn(
        "bg-white border rounded-2xl p-4 flex gap-4 transition-all overflow-hidden",
        resource.status === 'maintenance' 
          ? "border-gray-200 opacity-75 grayscale-[30%]" 
          : "border-gray-100 active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer"
      )}
    >
      <div className={cn(
        "w-24 h-24 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative",
        !resource.imageUrl && (isVehicle ? "bg-emerald-50 text-emerald-500" : "bg-emerald-50 text-emerald-500")
      )}>
        {resource.imageUrl ? (
          <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover" />
        ) : (
          isVehicle ? <CarFront size={32} /> : <Building2 size={32} />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center relative">
        <div className="flex justify-between items-start mb-1 pr-8">
          <h3 className="font-bold text-gray-900 leading-tight">{resource.name}</h3>
        </div>
        <div className="flex items-center text-xs text-gray-500 mb-2 gap-3">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{resource.capacity}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span className="capitalize">{resource.type}</span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          {canManageThisResource ? (
            <select
              value={resource.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateStatus?.(e.target.value as Resource['status']);
              }}
              className={cn("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border-none outline-none cursor-pointer", statusColors[resource.status])}
            >
              <option value="available" className="bg-white text-emerald-700">Tersedia</option>
              <option value="in-use" className="bg-white text-amber-700">Sedang Digunakan</option>
              <option value="maintenance" className="bg-white text-rose-700">Pemeliharaan</option>
            </select>
          ) : (
            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider", statusColors[resource.status])}>
              {statusText[resource.status]}
            </span>
          )}
        </div>

        {/* Delete Button for Admin */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-0 right-0 p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors z-10"
            title="Hapus Aset"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
