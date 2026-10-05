import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors, radius, spacing } from '@/constants/brand'

type Props = {
  label: string
  onPress: () => void
  variant?: 'gold' | 'green' | 'outline' | 'danger'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  icon?: ReactNode
  accessibilityHint?: string
}

export default function AppButton({
  label,
  onPress,
  variant = 'gold',
  disabled = false,
  loading = false,
  style,
  icon,
  accessibilityHint
}: Props) {
  const blocked = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        blocked && styles.disabled,
        pressed && !blocked && styles.pressed,
        style
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'green' ? colors.surface : colors.ink} />
        : icon}
      <Text style={[styles.label, variant === 'green' && styles.lightLabel, variant === 'danger' && styles.dangerLabel]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold
  },
  gold: {
    backgroundColor: colors.gold
  },
  green: {
    borderColor: colors.greenDeep,
    backgroundColor: colors.greenDeep
  },
  outline: {
    borderColor: colors.green,
    backgroundColor: colors.surface
  },
  danger: {
    borderColor: '#E6B8AE',
    backgroundColor: colors.dangerSoft
  },
  label: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  lightLabel: {
    color: colors.surface
  },
  dangerLabel: {
    color: colors.danger
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.78
  }
})
