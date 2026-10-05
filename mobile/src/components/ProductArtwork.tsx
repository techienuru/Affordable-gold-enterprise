import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '@/constants/brand'
import type { Product } from '@/types'

export default function ProductArtwork({ product, compact = false }: { product: Product; compact?: boolean }) {
  if (product.image_url) {
    return (
      <Image
        source={product.image_url}
        contentFit="cover"
        transition={160}
        accessibilityLabel={`${product.name} product photo`}
        style={[styles.artwork, compact && styles.compact]}
      />
    )
  }

  return (
    <View accessible style={[styles.artwork, styles.placeholder, compact && styles.compact]} accessibilityLabel={`${product.name}, photo unavailable`}>
      <View style={styles.jar} />
      <Text style={styles.placeholderText}>Affordable Gold</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  artwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.goldSoft
  },
  compact: {
    width: 78,
    height: 78,
    aspectRatio: 1,
    borderRadius: radius.md
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  jar: {
    width: '34%',
    height: '42%',
    borderWidth: 4,
    borderColor: colors.greenDeep,
    borderTopWidth: 9,
    borderRadius: 18,
    backgroundColor: colors.gold
  },
  placeholderText: {
    marginTop: 8,
    color: colors.greenDeep,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  }
})
