import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let active = true

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return

      setSession(data.session)
      setError(sessionError ? 'Your sign-in status could not be checked.' : '')
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('The shop needs its Supabase connection before Google sign-in can work.')
      return
    }

    setError('')
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/checkout`
      }
    })

    if (signInError) {
      setError('Google sign-in could not start. Please try again.')
    }
  }

  const signOut = async () => {
    if (!supabase) return

    setError('')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError('You could not be signed out. Please try again.')
    }
  }

  const value = useMemo(() => ({
    user: session?.user || null,
    accessToken: session?.access_token || null,
    loading,
    error,
    signInWithGoogle,
    signOut
  }), [session, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
