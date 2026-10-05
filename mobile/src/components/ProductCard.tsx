import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import ProductArtwork from '@/components/ProductArtwork'
import { colors, radius, shadow, spacing } from '@/constants/brand'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types'

export default function ProductCard({ product }: { product: Product }) {
  const available = product.stock > 0

  return (
    <View style={styles.card}>
      <ProductArtwork product={product} />
      <View style={styles.body}>
        <Text style={styles.category}>{product.category || 'Food item'}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit || 'Per item'}</Text>
        <View style={styles.bottom}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={[styles.availability, !available && styles.unavailable]}>
              {available ? 'Available' : 'Out of stock'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`See ${product.name}`}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>See product</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow
  },
  body: {
    padding: spacing.sm,
    paddingTop: spacing.md
  },
  category: {
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  name: {
    marginTop: 5,
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 26
  },
  unit: {
    marginTop: 4,
    color: colors.inkSoft,
    fontSize: 14
  },
  bottom: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  price: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  availability: {
    marginTop: 3,
    color: colors.green,
    fontSize: 12,
    fontWeight: '800'
  },
  unavailable: {
    color: colors.danger
  },
  link: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: radius.pill,
    backgroundColor: colors.surface
  },
  linkText: {
    color: colors.greenDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  pressed: {
    backgroundColor: colors.greenSoft
  }
})
