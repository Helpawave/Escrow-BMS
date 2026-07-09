// Simple localStorage auth service
interface User {
  id: string
  email: string
  name?: string
  companyName?: string
  phone?: string
  role: 'admin' | 'user'
  is_allowed: boolean
}

const USER_KEY = 'user'

export const AuthService = {
  getUser(): User | null {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    // Dispatch custom event to notify AuthContext in same tab
    window.dispatchEvent(new CustomEvent('userUpdated'))
  },

  clearUser(): void {
    localStorage.removeItem(USER_KEY)
  },

  isLoggedIn(): boolean {
    return this.getUser() !== null
  }
}
