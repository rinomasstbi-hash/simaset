import React from 'react';
import { useAppContext } from '../../store/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, CheckCircle2, AlertTriangle, Info, BellRing } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function NotificationsScreen() {
  const { notifications, markNotificationAsRead, currentUser, openLogin } = useAppContext();

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Bell className="text-emerald-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pusat Notifikasi</h2>
        <p className="text-gray-500 text-sm mb-8">Silakan login untuk menerima pembaruan terkait status reservasi Anda.</p>
        <button 
          onClick={openLogin}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-xl transition-colors shadow-sm"
        >
          Masuk ke Akun
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="bg-white px-5 pt-8 pb-4 border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={() => notifications.forEach(n => markNotificationAsRead(n.id))}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="p-4 pb-8">
        <div className="space-y-2">
          {notifications.map(notif => {
            
            const IconMap = {
              success: CheckCircle2,
              warning: AlertTriangle,
              info: Info,
              error: AlertTriangle,
            };

            const ColorMap = {
              success: 'bg-emerald-100 text-emerald-600',
              warning: 'bg-amber-100 text-amber-600',
              info: 'bg-blue-100 text-blue-600',
              error: 'bg-rose-100 text-rose-600',
            };

            const Icon = IconMap[notif.type] || Bell;
            
            return (
              <div 
                key={notif.id} 
                onClick={() => markNotificationAsRead(notif.id)}
                className={cn(
                  "bg-white border rounded-xl px-3 py-2.5 flex items-start gap-2.5 transition-all cursor-pointer",
                  notif.read ? "border-gray-100 opacity-75" : "border-emerald-200/80 shadow-xs"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  ColorMap[notif.type]
                )}>
                  <Icon size={15} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2 mb-0.5">
                    <h3 className={cn(
                      "text-[13px] leading-tight truncate flex items-center gap-1.5",
                      notif.read ? "font-semibold text-gray-700" : "font-bold text-gray-900"
                    )}>
                      <span>{notif.title}</span>
                      {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-normal shrink-0">
                      {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: id })}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-gray-600 leading-snug">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellRing className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 font-medium text-sm">Tidak ada notifikasi saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
