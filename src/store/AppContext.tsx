import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Resource, Booking, AppNotification, User } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

// Mock Data
const MOCK_RESOURCES: Resource[] = [];

const MOCK_BOOKINGS: Booking[] = [];

const MOCK_NOTIFICATIONS: AppNotification[] = [];

interface AppContextType {
  currentUser: User | null;
  authLoading: boolean;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  resources: Resource[];
  addResource: (data: Omit<Resource, 'id'>) => void;
  deleteResource: (id: string) => void;
  bookings: Booking[];
  notifications: AppNotification[];
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  markNotificationAsRead: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { userId?: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage`, error);
    return defaultValue;
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    // We fetch global resources and bookings since anyone might need to see them
    const unsubscribeResources = onSnapshot(collection(db, 'resources'), (snapshot) => {
      const res: Resource[] = [];
      snapshot.forEach(doc => {
        res.push({ id: doc.id, ...doc.data() } as Resource);
      });
      setResources(res);
    });

    const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const b: Booking[] = [];
      snapshot.forEach(doc => {
        b.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(b);
    });

    // We only fetch notifications for the current user once logged in
    let unsubscribeNotifications: () => void;
    if (currentUser) {
      // Notifications could be stored at root collection with userId field
      const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.id));
      unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        const nots: AppNotification[] = [];
        snapshot.forEach(doc => {
          nots.push({ id: doc.id, ...doc.data() } as AppNotification);
        });
        // Sort notifications by timestamp descending
        setNotifications(nots.sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
      });
    }

    return () => {
      unsubscribeResources();
      unsubscribeBookings();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [currentUser?.id]); // Also re-run if user changes so we fetch correct notifications

  const runFirestoreAysnc = async (promise: Promise<any>) => {
    try {
      await promise;
    } catch (error) {
      console.error("Firestore operation failed:", error);
      // Fallback UI or robust error handler can go here
    }
  };

  const addResource = (data: Omit<Resource, 'id'>) => {
    const id = `res_${Date.now()}`;
    runFirestoreAysnc(setDoc(doc(db, 'resources', id), { ...data, id }));
  };

  const deleteResource = (id: string) => {
    runFirestoreAysnc(deleteDoc(doc(db, 'resources', id)));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Admin identification based on specific email, for now we hardcore it or use 'admin' as text in email
        const isAdmin = user.email === 'admin@admin.com'; 
        setCurrentUser({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: isAdmin ? 'admin' : 'user',
          email: user.email || '',
          avatar: user.photoURL || null
        });
        
        // Save user to users collection for generic data references
        runFirestoreAysnc(setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: isAdmin ? 'admin' : 'user',
          email: user.email || '',
          avatar: user.photoURL || null
        }, { merge: true }));
        
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth);
  };

  const openLogin = () => setIsLoginModalOpen(true);
  const closeLogin = () => setIsLoginModalOpen(false);

  const addBooking = (newBookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const id = `b${Date.now()}`;
    const newBooking: Booking = {
      ...newBookingData,
      id,
      userName: currentUser?.name || 'User',
      userEmail: currentUser?.email || '',
      status: currentUser?.role === 'admin' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };
    
    runFirestoreAysnc(setDoc(doc(db, 'bookings', id), newBooking));
    
    if (currentUser?.role === 'user') {
      addNotification({
        userId: currentUser.id,
        title: 'Reservasi Diajukan',
        message: `Pemesanan Anda untuk ${newBookingData.title} sedang menunggu persetujuan.`,
        type: 'info'
      });
    } else {
       addNotification({
        userId: currentUser?.id || '',
        title: 'Reservasi Berhasil',
        message: `Pemesanan ${newBookingData.title} Anda langsung disetujui (Admin).`,
        type: 'success'
      });
    }
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    runFirestoreAysnc(updateDoc(doc(db, 'bookings', id), { status }));
    
    const booking = bookings.find(b => b.id === id);
    if (booking && booking.userId) {
      addNotification({
        userId: booking.userId,
        title: status === 'approved' ? 'Pemesanan Disetujui' : status === 'rejected' ? 'Pemesanan Ditolak' : 'Status Diperbarui',
        message: `Status pemesanan "${booking.title}" diubah menjadi ${status}.`,
        type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    runFirestoreAysnc(updateDoc(doc(db, 'notifications', id), { read: true }));
  };

  // Add userId to Notification Type in type.ts for this to work well
  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { userId: string }) => {
    const id = `n${Date.now()}`;
    const newNotif = {
      ...n,
      id,
      timestamp: new Date().toISOString(),
      read: false
    };
    runFirestoreAysnc(setDoc(doc(db, 'notifications', id), newNotif));
  };

  // Real-time status sync: automatically update resource status based on current active bookings
  useEffect(() => {
    const checkStatuses = () => {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      setResources(prevResources => {
        return prevResources.map(resource => {
          // If maintenance, keep it
          if (resource.status === 'maintenance') return resource;

          const activeBooking = bookings.find(b => 
            b.resourceId === resource.id &&
            b.status === 'approved' &&
            b.date === todayString &&
            b.startTime <= currentTimeString &&
            b.endTime >= currentTimeString
          );

          return {
            ...resource,
            status: activeBooking ? 'in-use' : 'available'
          };
        });
      });
    };

    checkStatuses();
    const interval = setInterval(checkStatuses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [bookings]);

  return (
    <AppContext.Provider value={{
      currentUser,
      authLoading,
      logout,
      isLoginModalOpen,
      openLogin,
      closeLogin,
      resources,
      addResource,
      deleteResource,
      bookings,
      notifications,
      addBooking,
      updateBookingStatus,
      markNotificationAsRead,
      addNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
