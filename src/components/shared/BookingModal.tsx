import React, { useState } from 'react';
import { Resource } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { X, Calendar as CalendarIcon, Clock, Users, Building, CarFront } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, addDays } from 'date-fns';

interface BookingModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export default function BookingModal({ resource, onClose }: BookingModalProps) {
  const { addBooking, currentUser, bookings } = useAppContext();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isPeriodFormat, setIsPeriodFormat] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Jam Ke 1-2');
  const [title, setTitle] = useState('');

  if (!resource) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !currentUser) return;
    
    // We still set a dummy startTime based on the period for sorting purposes in the calendar
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (isPeriodFormat && (resource.type === 'ruangan' || resource.type === 'laboratorium')) {
      // Create some default sorting times for the periods
      switch (selectedPeriod) {
        case 'Jam Ke 1-2': finalStartTime = '07:00'; finalEndTime = '08:20'; break;
        case 'Jam Ke 3-4': finalStartTime = '08:20'; finalEndTime = '09:40'; break;
        case 'Istirahat': finalStartTime = '09:40'; finalEndTime = '10:10'; break;
        case 'Jam Ke 5-6': finalStartTime = '10:10'; finalEndTime = '11:30'; break;
        case 'Jam Ke 7-8': finalStartTime = '12:00'; finalEndTime = '13:20'; break;
        default: finalStartTime = '07:00'; finalEndTime = '08:20'; break;
      }
    } else {
      if (!startTime || !endTime) return;
      if (startTime >= endTime) {
        alert("Waktu mulai harus sebelum waktu selesai.");
        return;
      }
    }

    // Check for schedule conflicts
    const overlappingBookings = bookings.filter(b => 
      b.resourceId === resource.id &&
      b.date === date && 
      b.status !== 'rejected'
    );

    let hasConflict = false;
    for (let b of overlappingBookings) {
      if (finalStartTime < b.endTime && finalEndTime > b.startTime) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      alert("Maaf, fasilitas ini sudah dipesan (atau menunggu persetujuan) pada waktu terpilih. Silakan pilih waktu lain.");
      return;
    }
    
    let bookingData: any = {
      resourceId: resource.id,
      userId: currentUser.id,
      title,
      date,
      startTime: finalStartTime,
      endTime: finalEndTime
    };
    if (isPeriodFormat) {
      bookingData.period = selectedPeriod;
    }
    
    addBooking(bookingData);
    onClose();
  };

  const isVehicle = resource.type === 'kendaraan';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-xl",
              isVehicle ? "bg-emerald-100 text-emerald-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {isVehicle ? <CarFront size={20} /> : <Building size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">{resource.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pb-24 overflow-y-auto flex-1 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tujuan Pemesanan</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isVehicle ? "Kegiatan dinas luar kota..." : "Rapat mingguan tim divisi..."}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tanggal</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" 
                required
                min={format(new Date(), 'yyyy-MM-dd')}
                max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-700"
              />
            </div>
          </div>

          {(resource.type === 'ruangan' || resource.type === 'laboratorium') && (
            <div className="flex items-center space-x-3 !mt-3 !mb-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPeriodFormat} 
                  onChange={(e) => setIsPeriodFormat(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Gunakan Format Jam Pelajaran</span>
              </label>
            </div>
          )}

          {isPeriodFormat && (resource.type === 'ruangan' || resource.type === 'laboratorium') ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Pilih Jam Pelajaran</label>
              <select 
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-gray-700"
              >
                <option value="Jam Ke 1-2">Jam Ke 1-2</option>
                <option value="Jam Ke 3-4">Jam Ke 3-4</option>
                <option value="Istirahat">Istirahat</option>
                <option value="Jam Ke 5-6">Jam Ke 5-6</option>
                <option value="Jam Ke 7-8">Jam Ke 7-8</option>
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Waktu Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="time" 
                    required={!isPeriodFormat}
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-700"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Waktu Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="time" 
                    required={!isPeriodFormat}
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-700"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3 text-blue-800">
            <Users className="shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <span className="font-semibold block mb-0.5">Kapasitas Maksimal: {resource.capacity} orang</span>
              <span className="opacity-80">Pastikan peserta tidak melebihi kapasitas {resource.type}.</span>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold flex items-center justify-center py-3.5 rounded-xl transition-all shadow-sm shadow-emerald-200"
          >
            Ajukan Reservasi
          </button>
        </form>
      </div>
    </div>
  );
}
