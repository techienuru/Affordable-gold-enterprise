import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '@/constants/brand'

export default function PageHeader({ eyebrow, title, message }: {
  eyebrow?: string
  title: string
  message?: string
}) {
  return (
    <View style={styles.wrap}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg
  },
  eyebrow: {
    marginBottom: spacing.sm,
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 40
  },
  message: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 16,
    lineHeight: 24
  }
})
