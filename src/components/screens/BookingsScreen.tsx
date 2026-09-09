import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Building2, CarFront, Clock, CalendarDays, CheckCircle2, XCircle, User } from 'lucide-react';

export default function BookingsScreen() {
  const { bookings, resources, currentUser, updateBookingStatus, openLogin } = useAppContext();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  
  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CalendarDays className="text-emerald-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pesanan & Reservasi</h2>
        <p className="text-gray-500 text-sm mb-8">Silakan login terlebih dahulu untuk melihat dan mengelola pesanan Anda.</p>
        <button 
          onClick={openLogin}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-xl transition-colors shadow-sm"
        >
          Masuk ke Akun
        </button>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const canManage = isAdmin || isManager;

  // Filter bookings based on role
  let displayBookings = bookings;
  if (isAdmin) {
    displayBookings = bookings;
  } else if (isManager) {
    displayBookings = bookings.filter(b => currentUser.managedResourceIds?.includes(b.resourceId));
  } else {
    displayBookings = bookings.filter(b => b.userId === currentUser.id);
  }

  // If admin/manager is on "pending" tab, only show pending ones
  if (canManage && activeTab === 'pending') {
    displayBookings = displayBookings.filter(b => b.status === 'pending');
  }

  // Sort: newest first
  displayBookings = [...displayBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-8">
      <div className="bg-white px-5 pt-8 pb-0 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{canManage ? 'Kelola Pesanan' : 'Pesanan Saya'}</h1>
        
        {canManage && (
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                "pb-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'pending' ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Menunggu Persetujuan
              {bookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[10px]">
                  {bookings.filter(b => b.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "pb-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'all' ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Semua Pesanan
            </button>
          </div>
        )}
        {!canManage && <div className="h-4"></div>}
      </div>

      <div className="p-5 space-y-3">
        {displayBookings.map(booking => {
          const resource = resources.find(r => r.id === booking.resourceId);
          if (!resource) return null;
          
          const isVehicle = resource.type === 'kendaraan';

          const statusStyles = {
            pending: 'bg-amber-100 text-amber-700',
            approved: 'bg-emerald-100 text-emerald-700',
            completed: 'bg-blue-100 text-blue-700',
            rejected: 'bg-rose-100 text-rose-700',
            cancelled: 'bg-gray-100 text-gray-700',
          };
          
          const statusLabels = {
            pending: 'Menunggu',
            approved: 'Disetujui',
            completed: 'Selesai',
            rejected: 'Ditolak',
            cancelled: 'Dibatalkan',
          };

          return (
            <div key={booking.id} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:border-emerald-200 transition-colors">
              {/* Baris 1: Judul & Status Badge */}
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-[13.5px] leading-tight truncate">
                    {booking.title}
                  </h3>
                  {canManage && (
                    <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <User size={11} className="text-gray-400 shrink-0" />
                      <span>Oleh: <strong className="text-gray-700 font-semibold">{booking.userName || booking.userEmail || booking.userId}</strong></span>
                    </p>
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 mt-0.5", 
                  statusStyles[booking.status]
                )}>
                  {statusLabels[booking.status]}
                </span>
              </div>

              {/* Baris 2: Informasi Terorganisir Tanpa Ruang Kosong (Aset, Tanggal, Jam) */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 pt-2 border-t border-gray-50 text-xs">
                {/* Aset / Fasilitas */}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                  {isVehicle ? <CarFront size={12} className="text-slate-500 shrink-0" /> : <Building2 size={12} className="text-slate-500 shrink-0" />}
                  <span className="truncate max-w-[130px]">{resource.name}</span>
                </span>

                {/* Tanggal */}
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 shrink-0">
                  <CalendarDays size={12} className="text-gray-400 shrink-0" />
                  <span>{format(new Date(booking.date), 'EEE, dd MMM yyyy', { locale: id })}</span>
                </span>

                {/* Jam */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 shrink-0">
                  <Clock size={12} className="shrink-0" />
                  <span>
                    {booking.period ? booking.period : `${booking.startTime} - ${booking.endTime}`}
                  </span>
                </span>
              </div>

              {/* ACTION BUTTONS FOR ADMIN / MANAGER */}
              {canManage && booking.status === 'pending' && (
                <div className="mt-2.5 pt-2 border-t border-gray-50 flex gap-2">
                  <button 
                    onClick={() => updateBookingStatus(booking.id, 'rejected')}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 flex justify-center items-center gap-1 transition-colors"
                  >
                    <XCircle size={14} /> Tolak
                  </button>
                  <button 
                    onClick={() => updateBookingStatus(booking.id, 'approved')}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex justify-center items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Setujui
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        {displayBookings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-500 font-medium text-sm">
              {canManage && activeTab === 'pending' ? 'Tidak ada pesanan yang menunggu persetujuan.' : 'Belum ada pesanan dibuat.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
