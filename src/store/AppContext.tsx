import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Resource, Booking, AppNotification, User } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc } from 'firebase/firestore';

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
  updateResourceStatus: (id: string, status: Resource['status']) => void;
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
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const updateResourceStatus = (id: string, status: Resource['status']) => {
    runFirestoreAysnc(updateDoc(doc(db, 'resources', id), { status }));
  };

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user from Firestore and listen to updates
        const userRef = doc(db, 'users', user.uid);
        
        // Initial get and establish snapshot
        unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            setCurrentUser(userData);
          } else {
            // First time login
            const isAdmin = user.email === 'admin@admin.com'; 
            const newUser: User = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              role: isAdmin ? 'admin' : 'user',
              email: user.email || '',
              avatar: user.photoURL || null
            };
            setCurrentUser(newUser);
            await setDoc(userRef, newUser);
          }
          setAuthLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          // Fallback
          setCurrentUser({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'user',
            email: user.email || '',
            avatar: user.photoURL || null
          });
          setAuthLoading(false);
        });
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const logout = () => {
    signOut(auth);
  };

  const openLogin = () => setIsLoginModalOpen(true);
  const closeLogin = () => setIsLoginModalOpen(false);

  const sendEmailNotification = (toEmail: string, subject: string, body: string) => {
    // In a real Firebase app, this would write to a 'mail' collection 
    // which triggers the "Trigger Email from Firestore" extension.
    console.log(`[Simulated Email to ${toEmail}] Subject: ${subject} | Body: ${body}`);
    // Just mock writing to mail collection
    const id = `mail_${Date.now()}`;
    runFirestoreAysnc(setDoc(doc(db, 'mail', id), {
      to: toEmail,
      message: {
        subject: subject,
        html: `<p>${body}</p>`
      }
    }));
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
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
      // Notify managers via email
      sendEmailNotification(
        'pengelola@mtsn4jombang.sch.id', 
        'Pesanan Baru Menunggu Persetujuan', 
        `Ada pesanan fasilitas baru dari ${currentUser.name} (${currentUser.email}). Silakan cek aplikasi untuk memberi persetujuan atau menolak.`
      );
      
      // Notify managers and admins via in-app notifications
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        usersSnapshot.docs.forEach(docSnap => {
          const u = docSnap.data() as User;
          if (u.role === 'admin' || (u.role === 'manager' && u.managedResourceIds?.includes(newBookingData.resourceId))) {
            addNotification({
              userId: u.id,
              title: 'Pesanan Baru',
              message: `${currentUser.name} mengajukan pesanan untuk fasilitas ${newBookingData.title}.`,
              type: 'info'
            });
          }
        });
      } catch (err) {
        console.error("Error notifying managers:", err);
      }
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
      sendEmailNotification(
        booking.userEmail || booking.userId,
        `Status Pesanan: ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
        `Pesanan Anda untuk fasilitas ${booking.title} telah ${status === 'approved' ? 'disetujui' : 'ditolak'} oleh pengelola.`
      );
    }
  };

  const markNotificationAsRead = (id: string) => {
    runFirestoreAysnc(updateDoc(doc(db, 'notifications', id), { read: true }));
  };

  // Add userId to Notification Type in type.ts for this to work well
  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { userId: string }) => {
    const id = `n${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newNotif = {
      ...n,
      id,
      timestamp: new Date().toISOString(),
      read: false
    };
    runFirestoreAysnc(setDoc(doc(db, 'notifications', id), newNotif));
  };

  const computedResources = React.useMemo(() => {
    const now = new Date();
    // Use local time for date and time comparisons
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
    const todayString = localISOTime.split('T')[0];
    const currentTimeString = localISOTime.split('T')[1].substring(0, 5);

    return resources.map(resource => {
      // Admin overrides to maintenance always persist
      if (resource.status === 'maintenance') return resource;

      // Automatically determine 'in-use' based on active bookings TODAY at CURRENT TIME
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
  }, [resources, bookings, currentTime]);

  return (
    <AppContext.Provider value={{
      currentUser,
      authLoading,
      logout,
      isLoginModalOpen,
      openLogin,
      closeLogin,
      resources: computedResources,
      addResource,
      deleteResource,
      updateResourceStatus,
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
