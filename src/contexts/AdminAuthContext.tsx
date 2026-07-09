import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin'
  is_allowed: boolean
}

interface AdminAuthContextType {
  adminUser: AdminUser | null
  isLoading: boolean
  isInitialized: boolean
  adminLogin: (email: string, password: string) => Promise<boolean>
  adminLogout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

const ADMIN_USER_KEY = 'admin_user'

const AdminAuthService = {
  getAdminUser(): AdminUser | null {
    const user = localStorage.getItem(ADMIN_USER_KEY)
    return user ? JSON.parse(user) : null
  },

  setAdminUser(user: AdminUser): void {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
    window.dispatchEvent(new CustomEvent('adminUserUpdated'))
  },

  clearAdminUser(): void {
    localStorage.removeItem(ADMIN_USER_KEY)
    window.dispatchEvent(new CustomEvent('adminUserUpdated'))
  },

  isAdminLoggedIn(): boolean {
    return this.getAdminUser() !== null
  }
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const storedAdminUser = AdminAuthService.getAdminUser()
    setAdminUser(storedAdminUser)
    setIsInitialized(true)

    const handleAdminUserUpdate = () => {
      const updatedAdminUser = AdminAuthService.getAdminUser()
      setAdminUser(updatedAdminUser)
    }
    
    window.addEventListener('adminUserUpdated', handleAdminUserUpdate)

    return () => {
      window.removeEventListener('adminUserUpdated', handleAdminUserUpdate)
    }
  }, [])

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile && profile.role === 'admin' && profile.is_allowed) {
        const adminUserData: AdminUser = {
          id: data.user.id,
          email: data.user.email!,
          name: profile.name,
          role: 'admin',
          is_allowed: profile.is_allowed
        }
        
        AdminAuthService.setAdminUser(adminUserData)
        setAdminUser(adminUserData)
        return true
      } else {
        await supabase.auth.signOut()
        throw new Error('Access denied: Admin privileges required')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const adminLogout = () => {
    supabase.auth.signOut()
    AdminAuthService.clearAdminUser()
    setAdminUser(null)
  }

  return (
    <AdminAuthContext.Provider value={{ 
      adminUser, 
      isLoading, 
      isInitialized, 
      adminLogin, 
      adminLogout 
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
