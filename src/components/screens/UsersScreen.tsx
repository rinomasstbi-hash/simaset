import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { User, Resource } from '../../types';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, Check } from 'lucide-react';

export default function UsersScreen() {
  const { currentUser, resources } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          ...doc.data()
        })) as User[];
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error) {
      console.error("Error updating user role:", error);
      alert('Gagal memperbarui role!');
    }
  };

  const toggleManagedResource = async (userId: string, resourceId: string, currentManaged: string[] = []) => {
    try {
      let newManaged = [...currentManaged];
      if (newManaged.includes(resourceId)) {
        newManaged = newManaged.filter(id => id !== resourceId);
      } else {
        newManaged.push(resourceId);
      }
      
      await updateDoc(doc(db, 'users', userId), { managedResourceIds: newManaged });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, managedResourceIds: newManaged } : u
      ));
    } catch (error) {
      console.error("Error updating managed resources:", error);
      alert('Gagal memperbarui aset yang dikelola!');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center text-gray-500">
        Akses ditolak.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <header className="bg-white border-b px-4 py-4 pt-safe sticky top-0 z-20">
        <h1 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h1>
        <p className="text-sm text-slate-500">Kelola role pengguna aplikasi</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white border rounded-xl w-full flex flex-col p-4 shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                    disabled={user.id === currentUser.id}
                    className="bg-gray-50 border text-sm rounded-lg px-2 py-1 outline-none disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="manager">Pengelola Aset</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              {user.role === 'manager' && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Aset yang Dikelola:</p>
                  <div className="flex flex-wrap gap-2">
                    {resources.map(resource => {
                      const isManaged = user.managedResourceIds?.includes(resource.id);
                      return (
                        <button
                          key={resource.id}
                          onClick={() => toggleManagedResource(user.id, resource.id, user.managedResourceIds)}
                          className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                            isManaged 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {isManaged && <Check className="w-3 h-3" />}
                          {resource.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
