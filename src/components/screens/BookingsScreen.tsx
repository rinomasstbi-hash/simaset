import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Building2, CarFront, Clock, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

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

  // For users, show their own bookings. For admins, show ALL bookings.
  let displayBookings = isAdmin 
    ? bookings 
    : bookings.filter(b => b.userId === currentUser.id);

  // If admin is on "pending" tab, only show pending ones
  if (isAdmin && activeTab === 'pending') {
    displayBookings = displayBookings.filter(b => b.status === 'pending');
  }

  // Sort: newest first
  displayBookings = [...displayBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="bg-white px-5 pt-8 pb-0 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{isAdmin ? 'Kelola Pesanan' : 'Pesanan Saya'}</h1>
        
        {isAdmin && (
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
        {!isAdmin && <div className="h-4"></div>}
      </div>

      <div className="p-5 space-y-4">
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
            pending: 'Menunggu Persetujuan',
            approved: 'Disetujui',
            completed: 'Selesai',
            rejected: 'Ditolak',
            cancelled: 'Dibatalkan',
          };

          return (
            <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <span className={cn(
                    "inline-block px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg mb-2", 
                    statusStyles[booking.status]
                  )}>
                    {statusLabels[booking.status]}
                  </span>
                  <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-1">{booking.title}</h3>
                  {isAdmin && (
                    <p className="text-xs text-gray-500 font-medium">Oleh: {booking.userName || booking.userEmail || booking.userId}</p>
                  )}
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50/50 flex flex-col gap-2">
                <div className="flex items-center text-xs text-gray-600">
                  <CalendarDays size={14} className="mr-2 text-gray-400" />
                  <span>{format(new Date(booking.date), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Clock size={14} className="mr-2 text-gray-400" />
                  {booking.period ? (
                    <span>{booking.period}</span>
                  ) : (
                    <span>{booking.startTime} - {booking.endTime} WIB</span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  {isVehicle ? <CarFront size={14} className="mr-2 text-gray-400" /> : <Building2 size={14} className="mr-2 text-gray-400" />}
                  <span className="font-medium">{resource.name}</span>
                </div>
              </div>

              {/* ACTION BUTTONS FOR ADMIN */}
              {isAdmin && booking.status === 'pending' && (
                <div className="p-3 border-t border-gray-50 flex gap-2">
                  <button 
                    onClick={() => updateBookingStatus(booking.id, 'rejected')}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 flex justify-center items-center gap-1 transition-colors"
                  >
                    <XCircle size={16} /> Tolak
                  </button>
                  <button 
                    onClick={() => updateBookingStatus(booking.id, 'approved')}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex justify-center items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 size={16} /> Setujui
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
              {isAdmin && activeTab === 'pending' ? 'Tidak ada pesanan yang menunggu persetujuan.' : 'Belum ada pesanan dibuat.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
