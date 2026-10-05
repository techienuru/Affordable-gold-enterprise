import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '@/constants/brand'

export default function QuantityStepper({ value, maximum, onChange }: {
  value: number
  maximum: number
  onChange: (quantity: number) => void
}) {
  return (
    <View style={styles.wrap} accessibilityLabel={`Quantity ${value}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= 1}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [styles.button, value <= 1 && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= maximum}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [styles.button, value >= maximum && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    backgroundColor: colors.goldSoft
  },
  disabled: {
    opacity: 0.35
  },
  symbol: {
    color: colors.greenDeep,
    fontSize: 24,
    fontWeight: '800'
  },
  value: {
    minWidth: 32,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center'
  }
})
