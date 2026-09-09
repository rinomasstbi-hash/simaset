import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Building2, CarFront, Clock, User } from 'lucide-react';

export default function CalendarScreen() {
  const { bookings, resources } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate 14 days starting from current week's monday or just today
  const days = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  const daysBookings = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled' && b.status !== 'rejected');
  }, [bookings, selectedDate]);

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="bg-white px-5 pt-8 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Jadwal Penggunaan</h1>
        
        {/* Horizontal Date Picker */}
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {days.map(date => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] py-3 rounded-2xl transition-all duration-200 snap-center border",
                  isSelected 
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200" 
                    : "bg-white border-gray-100 text-gray-500 hover:border-emerald-200"
                )}
              >
                <span className="text-xs font-medium mb-1 uppercase tracking-wider">
                  {format(date, 'EEE', { locale: id })}
                </span>
                <span className={cn(
                  "text-xl font-bold",
                  isSelected ? "text-white" : "text-gray-900"
                )}>
                  {format(date, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-5 pb-8">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>{format(selectedDate, 'dd MMMM yyyy', { locale: id })}</span>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{daysBookings.length} Agenda</span>
        </h2>

        {daysBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-8 text-center mt-10 text-gray-400">
            <CalendarPlaceholder />
            <p className="mt-4 text-sm font-medium text-gray-500">Tidak ada agenda pada hari ini.</p>
          </div>
        ) : (
          <div className="space-y-2.5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {daysBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(booking => {
              const resource = resources.find(r => r.id === booking.resourceId);
              if (!resource) return null;
              const isVehicle = resource.type === 'kendaraan';

              return (
                <div key={booking.id} className="relative flex items-start group">
                  <div className="absolute left-5 -translate-x-1/2 top-3 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-gray-50"></div>
                  </div>
                  
                  <div className="ml-10 bg-white px-3.5 py-2.5 rounded-xl border border-gray-100 shadow-sm w-full hover:border-emerald-200 transition-colors">
                    {/* Baris 1: Judul & Status */}
                    <div className="flex justify-between items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-gray-900 text-[13px] leading-tight truncate">
                        {booking.title}
                      </h3>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                        booking.status === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {booking.status === 'approved' ? 'Terkonfirmasi' : 'Menunggu'}
                      </span>
                    </div>

                    {/* Baris 2: Informasi Terorganisir Tanpa Ruang Kosong (Aset, Jam, Pemesan) */}
                    <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs">
                      {/* Aset / Fasilitas */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md shrink-0">
                        {isVehicle ? <CarFront size={12} className="text-slate-500 shrink-0" /> : <Building2 size={12} className="text-slate-500 shrink-0" />}
                        <span className="truncate max-w-[120px]">{resource.name}</span>
                      </span>

                      {/* Jam / Periode */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 shrink-0">
                        <Clock size={12} className="shrink-0" />
                        <span>{booking.period ? booking.period : `${booking.startTime} - ${booking.endTime}`}</span>
                      </span>

                      {/* Pemesan */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 ml-auto shrink-0">
                        <User size={11} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{booking.userName || 'User'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarPlaceholder() {
  return (
    <svg className="mx-auto h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
