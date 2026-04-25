import React, { useState, useEffect } from 'react';
import { Home, Calendar, ClipboardList, Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../../types';

import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import BookingsScreen from '../screens/BookingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoginModal from '../shared/LoginModal';

export type TabType = 'home' | 'calendar' | 'bookings' | 'notifications';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { notifications, currentUser, authLoading } = useAppContext();
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  
  const unreadCount = currentUser ? notifications.filter(n => !n.read).length : 0;

  // Listen for new notifications to show as toasts
  useEffect(() => {
    if (notifications.length > 0 && currentUser) {
      const latest = notifications[0];
      // Only show if it is less than 5 seconds old
      if (new Date().getTime() - new Date(latest.timestamp).getTime() < 5000) {
        setToasts(prev => [latest, ...prev].slice(0, 3));
        
        const timer = setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== latest.id));
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const renderScreen = () => {
    if (authLoading) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'home': return <DashboardScreen onNavigate={setActiveTab} />;
      case 'calendar': return <CalendarScreen />;
      case 'bookings': return <BookingsScreen />;
      case 'notifications': return <NotificationsScreen />;
      default: return <DashboardScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen text-slate-800 font-sans sm:p-4">
      <LoginModal />
      {/* Mobile Wrapper Simulator */}
      <div className="w-full max-w-md bg-white min-h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden sm:rounded-[2.5rem] sm:min-h-[850px] sm:max-h-[850px] ring-1 ring-gray-200">
        
        {/* Toast Container */}
        <div className="absolute top-4 left-0 right-0 px-4 z-[60] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => {
              const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'warning' ? AlertTriangle : Info;
              const bgColor = toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 
                             toast.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100' : 
                             'bg-emerald-50 text-emerald-800 border-emerald-100';
              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  className={cn("p-3 rounded-xl border flex items-start gap-3 shadow-lg pointer-events-auto", bgColor)}
                >
                  <Icon size={18} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-none mb-1">{toast.title}</h4>
                    <p className="text-xs opacity-90 leading-tight">{toast.message}</p>
                  </div>
                  <button onClick={() => removeToast(toast.id)} className="shrink-0 p-1 hover:bg-black/5 rounded-full absolute top-2 right-2">
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 grid grid-cols-4 h-[72px] pb-safe z-50">
          <NavItem 
            icon={<Home className="w-[22px] h-[22px]" />} 
            label="Beranda" 
            isActive={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon={<Calendar className="w-[22px] h-[22px]" />} 
            label="Kalender" 
            isActive={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
          />
          <NavItem 
            icon={<ClipboardList className="w-[22px] h-[22px]" />} 
            label="Pesanan" 
            isActive={activeTab === 'bookings'} 
            onClick={() => setActiveTab('bookings')} 
          />
          <NavItem 
            icon={<Bell className="w-[22px] h-[22px]" />} 
            label="Notifikasi" 
            isActive={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')} 
            badgeCount={unreadCount}
          />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, badgeCount }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; badgeCount?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 relative",
        isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <div className={cn("transition-transform duration-200 relative", isActive && "transform scale-110")}>
        {icon}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold px-[4px] py-[1px] rounded-full min-w-[14px] text-center border-2 border-white leading-none shadow-sm flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {/* Active Dot */}
      <div className={cn(
        "w-1 h-1 rounded-full mt-0.5 transition-opacity duration-200 absolute bottom-1",
        isActive ? "bg-emerald-600 opacity-100" : "opacity-0"
      )} />
    </button>
  );
}
