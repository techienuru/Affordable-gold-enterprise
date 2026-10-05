import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import AppButton from '@/components/AppButton'
import { colors, radius, shadow, spacing } from '@/constants/brand'

type Props = {
  title: string
  message: string
  loading?: boolean
  actionLabel?: string
  onAction?: () => void
}

export default function StatusPanel({ title, message, loading = false, actionLabel, onAction }: Props) {
  return (
    <View style={styles.panel} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator size="large" color={colors.green} />}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && <AppButton label={actionLabel} onPress={onAction} style={styles.button} />}
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow
  },
  title: {
    marginTop: spacing.xs,
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center'
  },
  message: {
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch'
  }
})
