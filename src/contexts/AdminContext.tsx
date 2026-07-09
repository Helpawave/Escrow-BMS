import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const isSuperEmail = session.user.email === 'admin_bms@escrowbms.com';
                              
          if (isSuperEmail) {
            setIsAdminAuthenticated(true);
          } else {
            // Check if super_admin in user_roles
            const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
            const isSuperRole = roles?.some((r: any) => r.role === 'super_admin') || false;

            if (isSuperRole) {
              setIsAdminAuthenticated(true);
            } else {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profile?.role === 'admin') {
                setIsAdminAuthenticated(true);
              } else {
                setIsAdminAuthenticated(false);
              }
            }
          }
        } else {
          setIsAdminAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isSuperEmail = session.user.email === 'admin_bms@escrowbms.com';

        if (isSuperEmail) {
          setIsAdminAuthenticated(true);
        } else {
          // Check if super_admin in user_roles
          const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
          const isSuperRole = roles?.some((r: any) => r.role === 'super_admin') || false;

          if (isSuperRole) {
            setIsAdminAuthenticated(true);
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile?.role === 'admin') {
              setIsAdminAuthenticated(true);
            } else {
              setIsAdminAuthenticated(false);
            }
          }
        }
      } else {
        setIsAdminAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) throw error;
      if (data.user) {
        const isSuperEmail = data.user.email === 'admin_bms@escrowbms.com';

        if (isSuperEmail) {
          setIsAdminAuthenticated(true);
          return true;
        }

        // Check if super_admin in user_roles
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id);
        const isSuperRole = roles?.some((r: any) => r.role === 'super_admin') || false;

        if (isSuperRole) {
          setIsAdminAuthenticated(true);
          return true;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.role === 'admin') {
          setIsAdminAuthenticated(true);
          return true;
        } else {
          await supabase.auth.signOut();
        }
      }
      return false;
    } catch (err) {
      console.error('Admin login error:', err);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdminAuthenticated(false);
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

