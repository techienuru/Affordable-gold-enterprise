import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import AppButton from '@/components/AppButton'
import PageHeader from '@/components/PageHeader'
import Screen from '@/components/Screen'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { useAuth } from '@/context/AuthContext'

export default function AccountScreen() {
  const {
    user,
    profile,
    loading,
    profileLoading,
    error,
    redirectUrl,
    signInWithGoogle,
    signOut
  } = useAuth()

  if (loading || profileLoading) {
    return (
      <Screen>
        <StatusPanel title="Checking your account" message="This will only take a moment." loading />
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader eyebrow="Your account" title={user ? 'Welcome back' : 'Sign in'} message="Your account keeps orders and checkout details together." />

      {!user ? (
        <View style={styles.card}>
          <Text style={styles.title}>Continue with Google</Text>
          <Text style={styles.message}>Browsing is open to everyone. Sign in only when you are ready to order or view order history.</Text>
          <AppButton label="Sign in with Google" variant="green" onPress={signInWithGoogle} style={styles.button} />
          <Text style={styles.redirect}>Mobile sign-in return address: {redirectUrl}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          <View style={styles.card}>
            <Text style={styles.title}>{profile?.full_name || user.user_metadata?.full_name || 'Customer account'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.role}>
              <Text style={styles.roleText}>{profile?.role === 'admin' ? 'Administrator' : 'Customer'}</Text>
            </View>
          </View>

          <AppButton label="View your orders" variant="outline" onPress={() => router.navigate('/orders')} />
          {profile?.role === 'admin' && (
            <AppButton label="Open shop admin" variant="green" onPress={() => router.push('/admin')} />
          )}
          <AppButton label="Sign out" variant="danger" onPress={signOut} />
        </View>
      )}

      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  message: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 23
  },
  email: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 15
  },
  role: {
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft
  },
  roleText: {
    color: colors.greenDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  button: {
    marginTop: spacing.lg
  },
  redirect: {
    marginTop: spacing.md,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 16
  },
  error: {
    marginTop: spacing.md,
    padding: spacing.md,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  }
})
