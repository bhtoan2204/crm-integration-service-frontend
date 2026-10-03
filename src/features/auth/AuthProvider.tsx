import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/models'
import { findUser, subscribeStore } from '@/mocks/store'
import { authService } from '@/services/employeeService'
import { can, type Permission } from '@/utils/permissions'

const SESSION_KEY = 'logiscrm.session'
const REMEMBER_KEY = 'logiscrm.remember'

interface Session {
  userId: string
}

interface AuthContextValue {
  user: User | null
  ready: boolean
  rememberedEmail: string
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [rememberedEmail, setRememberedEmail] = useState('')

  useEffect(() => {
    const session = readSession()
    if (session) setUser(findUser(session.userId))
    setRememberedEmail(localStorage.getItem(REMEMBER_KEY) ?? '')
    setReady(true)
  }, [])

  useEffect(() => {
    return subscribeStore(() => {
      setUser((current) => {
        if (!current) return current
        const next = findUser(current.id)
        return next ? { ...next } : null
      })
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      rememberedEmail,
      can: (permission) => can(user?.role, permission),
      login: async (email, password, remember) => {
        const next = await authService.login(email, password)
        const payload = JSON.stringify({ userId: next.id } satisfies Session)
        if (remember) {
          localStorage.setItem(SESSION_KEY, payload)
          sessionStorage.removeItem(SESSION_KEY)
          localStorage.setItem(REMEMBER_KEY, email.trim())
          setRememberedEmail(email.trim())
        } else {
          sessionStorage.setItem(SESSION_KEY, payload)
          localStorage.removeItem(SESSION_KEY)
        }
        setUser(next)
      },
      logout: () => {
        localStorage.removeItem(SESSION_KEY)
        sessionStorage.removeItem(SESSION_KEY)
        setUser(null)
      },
    }),
    [user, ready, rememberedEmail],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phải được dùng trong AuthProvider')
  return context
}
