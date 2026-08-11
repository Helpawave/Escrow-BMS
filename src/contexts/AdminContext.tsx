import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdminAuthenticated: false,
  isInitializing: true,
  login: async () => false,
  logout: () => { },
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, userRoles, isSuperAdmin, signIn, signOut } = useAuth();

  // Canonical authorization source: user_roles table (via userRoles state in AuthContext)
  const hasCanonicalAdminRole = userRoles.includes('admin') || userRoles.includes('super_admin') || isSuperAdmin;
  const isAdminAuthenticated = !!user && hasCanonicalAdminRole;
  const isInitializing = loading;

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { error } = await signIn(username, password);
      if (error) return false;
      return true;
    } catch (err) {
      console.error('Admin login error:', err);
      return false;
    }
  };

  const logout = async () => {
    await signOut();
  };

  return (
    <AdminContext.Provider value={{ isAdminAuthenticated, isInitializing, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
