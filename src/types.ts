export type Role = 'user' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string | null;
  managedResourceIds?: string[];
}

export type ResourceType = 'ruangan' | 'laboratorium' | 'aula' | 'kendaraan';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity?: number; // vehicles might have smaller capacity, halls have larger
  description: string;
  imageUrl?: string;
  status: 'available' | 'in-use' | 'maintenance';
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  period?: string; // Optional field for school periods (e.g. Jam Ke 1-2)
  status: BookingStatus;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  type: 'success' | 'warning' | 'info' | 'error';
}
