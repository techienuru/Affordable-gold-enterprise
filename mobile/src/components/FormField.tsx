import type { ComponentProps } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radius, spacing } from '@/constants/brand'

type Props = ComponentProps<typeof TextInput> & {
  label: string
  hint?: string
  error?: string
}

export default function FormField({ label, hint, error, multiline, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor="#8B847A"
        selectionColor={colors.green}
        style={[styles.input, multiline && styles.multiline, error && styles.inputError, style]}
        accessibilityLabel={label}
      />
      {error
        ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
        : hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 7
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    color: colors.ink,
    backgroundColor: colors.surface,
    fontSize: 16
  },
  multiline: {
    minHeight: 96,
    paddingTop: 14,
    textAlignVertical: 'top'
  },
  inputError: {
    borderColor: colors.danger
  },
  hint: {
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 17
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17
  }
})
