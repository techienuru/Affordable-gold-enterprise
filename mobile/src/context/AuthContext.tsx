import { createContext, useContext, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import type { Session, User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

WebBrowser.maybeCompleteAuthSession()

type AuthContextValue = {
  user: User | null
  session: Session | null
  accessToken: string | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  error: string
  redirectUrl: string
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const readCallback = async (url: string) => {
  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return
  }

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''))
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')

  if (!accessToken || !refreshToken) {
    throw new Error('Google did not return a usable sign-in session.')
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  if (error) throw error
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState('')
  const redirectUrl = Linking.createURL('auth/callback')
  const userId = session?.user.id

  useEffect(() => {
    if (!hasSupabaseConfig) return

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      setSession(data.session)
      setProfileLoading(Boolean(data.session?.user))
      setError(sessionError ? 'Your sign-in status could not be checked.' : '')
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setProfileLoading(Boolean(nextSession?.user))
      if (!nextSession?.user) setProfile(null)
      setLoading(false)
    })

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    })

    return () => {
      data.subscription.unsubscribe()
      appState.remove()
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    let active = true

    supabase
      .from('profiles')
      .select('id,email,full_name,phone,role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setProfile(data as Profile | null)
        setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const signInWithGoogle = async () => {
    if (!hasSupabaseConfig) {
      setError('Add the Supabase settings to mobile/.env first.')
      return false
    }

    setError('')

    try {
      const { data, error: startError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      })

      if (startError || !data.url) throw startError || new Error('Google sign-in could not start.')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

      if (result.type !== 'success') return false

      await readCallback(result.url)
      return true
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Google sign-in could not finish.')
      return false
    }
  }

  const signOut = async () => {
    setError('')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) setError('You could not be signed out. Please try again.')
  }

  const value: AuthContextValue = {
    user: session?.user || null,
    session,
    accessToken: session?.access_token || null,
    profile,
    loading,
    profileLoading,
    error,
    redirectUrl,
    signInWithGoogle,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
