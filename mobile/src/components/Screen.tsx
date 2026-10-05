import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { colors, spacing } from '@/constants/brand'

type Props = {
  children: ReactNode
  scroll?: boolean
  padded?: boolean
  keyboard?: boolean
  testID?: string
}

export default function Screen({ children, scroll = true, padded = true, keyboard = false, testID }: Props) {
  const content = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, padded && styles.padded]}
      testID={testID}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fixed, padded && styles.padded]} testID={testID}>{children}</View>
  )

  if (!keyboard) return content

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {content}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.paper
  },
  content: {
    flexGrow: 1,
    backgroundColor: colors.paper,
    paddingBottom: 120
  },
  fixed: {
    flex: 1,
    backgroundColor: colors.paper
  },
  padded: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  }
})
