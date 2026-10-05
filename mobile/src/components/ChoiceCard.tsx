import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '@/constants/brand'

export default function ChoiceCard({
  title,
  message,
  selected,
  disabled = false,
  onPress
}: {
  title: string
  message: string
  selected: boolean
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.dot} />}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.green,
    backgroundColor: colors.greenSoft
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.76
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.inkSoft,
    borderRadius: 11
  },
  radioSelected: {
    borderColor: colors.greenDeep
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.greenDeep
  },
  copy: {
    flex: 1
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  message: {
    marginTop: 3,
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 18
  }
})
