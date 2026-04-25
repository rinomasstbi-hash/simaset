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

      <div className="p-5">
        <div className="space-y-3">
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
                  "bg-white border rounded-2xl p-4 flex gap-4 transition-all cursor-pointer",
                  notif.read ? "border-gray-100 opacity-70" : "border-emerald-100 shadow-sm"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  ColorMap[notif.type]
                )}>
                  <Icon size={20} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                      "text-sm",
                      notif.read ? "font-semibold text-gray-700" : "font-bold text-gray-900"
                    )}>
                      {notif.title}
                    </h3>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: id })}
                  </span>
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
