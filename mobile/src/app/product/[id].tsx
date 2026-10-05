import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import AppButton from '@/components/AppButton'
import ProductArtwork from '@/components/ProductArtwork'
import QuantityStepper from '@/components/QuantityStepper'
import Screen from '@/components/Screen'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/format'
import { getProduct } from '@/lib/supabase'
import type { Product } from '@/types'

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [added, setAdded] = useState(false)

  const load = async () => {
    if (!id) return
    setState('loading')

    try {
      const data = await getProduct(id)
      setProduct(data)
      setState(data ? 'ready' : 'missing')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    if (!id) return
    let active = true

    getProduct(id)
      .then((data) => {
        if (!active) return
        setProduct(data)
        setState(data ? 'ready' : 'missing')
      })
      .catch(() => {
        if (active) setState('error')
      })

    return () => {
      active = false
    }
  }, [id])

  if (state !== 'ready' || !product) {
    return (
      <Screen>
        {state === 'loading' && <StatusPanel title="Loading product" message="Checking its latest price and stock." loading />}
        {state === 'missing' && <StatusPanel title="Product not found" message="It may no longer be available." actionLabel="Back to shop" onAction={() => router.navigate('/')} />}
        {state === 'error' && <StatusPanel title="Product could not be loaded" message="Check your connection and try again." actionLabel="Try again" onAction={load} />}
      </Screen>
    )
  }

  const available = product.stock > 0
  const addToCart = () => {
    addItem(product, quantity)
    setAdded(true)
  }

  return (
    <Screen>
      <ProductArtwork product={product} />
      <View style={styles.copy}>
        <Text style={styles.category}>{product.category || 'Food item'}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit || 'Per item'}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={[styles.availability, !available && styles.unavailable]}>
          {available ? `${product.stock} available` : 'Out of stock'}
        </Text>
        <Text style={styles.description}>{product.description || 'A quality food item from Affordable Gold Enterprise.'}</Text>

        {available && (
          <View style={styles.purchase}>
            <Text style={styles.label}>Quantity</Text>
            <QuantityStepper value={quantity} maximum={product.stock} onChange={setQuantity} />
            <AppButton label={added ? 'Added to cart' : 'Add to cart'} onPress={addToCart} style={styles.button} />
            {added && <AppButton label="View cart" variant="outline" onPress={() => router.navigate('/cart')} />}
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  copy: {
    marginTop: spacing.lg
  },
  category: {
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  title: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.3,
    lineHeight: 40
  },
  unit: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 15
  },
  price: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900'
  },
  availability: {
    marginTop: spacing.xs,
    color: colors.green,
    fontSize: 14,
    fontWeight: '800'
  },
  unavailable: {
    color: colors.danger
  },
  description: {
    marginTop: spacing.lg,
    color: colors.inkSoft,
    fontSize: 16,
    lineHeight: 25
  },
  purchase: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  button: {
    marginTop: spacing.sm
  }
})
