import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import AppButton from '@/components/AppButton'
import PageHeader from '@/components/PageHeader'
import ProductArtwork from '@/components/ProductArtwork'
import QuantityStepper from '@/components/QuantityStepper'
import Screen from '@/components/Screen'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { useCart } from '@/context/CartContext'
import { formatKobo, formatPrice } from '@/lib/format'

export default function CartScreen() {
  const { items, subtotalKobo, updateQuantity, removeItem } = useCart()

  return (
    <Screen>
      <PageHeader eyebrow="Your basket" title="Cart" message="Review quantities before checkout." />

      {items.length === 0 ? (
        <StatusPanel
          title="Your cart is empty"
          message="Add honey or another food item from the shop."
          actionLabel="Browse the shop"
          onAction={() => router.navigate('/')}
        />
      ) : (
        <>
          <View style={styles.list}>
            {items.map((item) => (
              <View style={styles.item} key={item.id}>
                <ProductArtwork product={item} compact />
                <View style={styles.copy}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.unit}>{item.unit || 'Per item'} · {formatPrice(item.price)}</Text>
                  <Text style={styles.lineTotal}>{formatPrice(Number(item.price) * item.quantity)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <QuantityStepper
                    value={item.quantity}
                    maximum={item.stock}
                    onChange={(quantity) => updateQuantity(item.id, quantity)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name} from cart`}
                    onPress={() => removeItem(item.id)}
                    style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryTotal}>{formatKobo(subtotalKobo)}</Text>
            <Text style={styles.summaryMessage}>Delivery is calculated at checkout. Pickup is free.</Text>
            <AppButton label="Continue to checkout" onPress={() => router.push('/checkout')} style={styles.checkoutButton} />
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  item: {
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  copy: {
    flex: 1,
    minWidth: 160
  },
  name: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  unit: {
    marginTop: 4,
    color: colors.inkSoft,
    fontSize: 13
  },
  lineTotal: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  itemActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  remove: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.55
  },
  summary: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  summaryLabel: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: '800'
  },
  summaryTotal: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900'
  },
  summaryMessage: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 20
  },
  checkoutButton: {
    marginTop: spacing.lg
  }
})
