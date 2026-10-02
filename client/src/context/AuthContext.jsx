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
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
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
      setProfileLoading(Boolean(data.session?.user))
      setError(sessionError ? 'Your sign-in status could not be checked.' : '')
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setProfileLoading(Boolean(nextSession?.user))
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null)
      setProfileLoading(false)
      return undefined
    }

    let active = true
    setProfileLoading(true)

    supabase
      .from('profiles')
      .select('id,email,full_name,phone,role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setProfile(data)
        setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user])

  const signInWithGoogle = async (returnPath = '/checkout') => {
    if (!supabase) {
      setError('The shop needs its Supabase connection before Google sign-in can work.')
      return
    }

    setError('')
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${returnPath.startsWith('/') ? returnPath : '/checkout'}`
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
    profile,
    profileLoading,
    loading,
    error,
    signInWithGoogle,
    signOut
  }), [session, profile, profileLoading, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
