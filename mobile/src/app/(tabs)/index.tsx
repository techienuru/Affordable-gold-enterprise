import { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import ProductCard from '@/components/ProductCard'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { getProducts } from '@/lib/supabase'
import type { Product } from '@/types'

export default function ShopScreen() {
  const { width } = useWindowDimensions()
  const columns = width >= 720 ? 2 : 1
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState('All')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setState('loading')

    try {
      setProducts(await getProducts())
      setState('ready')
    } catch {
      setState('error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    load()
  }, [load]))

  const categories = useMemo(() => [
    'All',
    ...Array.from(new Set(products.map((product) => product.category).filter(Boolean) as string[]))
  ], [products])
  const visibleProducts = category === 'All'
    ? products
    : products.filter((product) => product.category === category)

  return (
    <FlatList
      key={`shop-${columns}`}
      data={state === 'ready' ? visibleProducts : []}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.productCell, columns === 2 && styles.productCellTwo]}>
          <ProductCard product={item} />
        </View>
      )}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      columnWrapperStyle={columns === 2 ? styles.row : undefined}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.green} />}
      ListHeaderComponent={(
        <>
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brand}>Affordable Gold</Text>
              <Text style={styles.brandSmall}>Enterprise</Text>
            </View>
            <Text style={styles.delivery}>Keffi · Lafia · Abuja</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Food you can trust</Text>
              <Text style={styles.heroTitle}>Good food, fairly priced.</Text>
              <Text style={styles.heroMessage}>Shop natural honey and everyday food items with delivery across Nigeria.</Text>
            </View>
            <View style={styles.stamp} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text style={styles.stampText}>Pure</Text>
              <Text style={styles.stampSmall}>and local</Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Shop products</Text>
            <Text style={styles.sectionMessage}>Clear prices. No hidden product costs.</Text>
          </View>

          {products.length > 0 && (
            <View style={styles.filters} accessibilityRole="radiogroup">
              {categories.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: category === item }}
                  onPress={() => setCategory(item)}
                  style={({ pressed }) => [
                    styles.filter,
                    category === item && styles.filterActive,
                    pressed && styles.filterPressed
                  ]}
                >
                  <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {state === 'loading' && <StatusPanel title="Loading the shop" message="Fetching the latest products and prices." loading />}
          {state === 'error' && <StatusPanel title="Products could not be loaded" message="Check your connection and try again." actionLabel="Try again" onAction={() => load()} />}
          {state === 'ready' && visibleProducts.length === 0 && <StatusPanel title="No products here yet" message="Choose another category or check again later." />}
        </>
      )}
      ListFooterComponent={state === 'ready' && products.length > 0 ? (
        <View style={styles.trustStrip}>
          <Text style={styles.trustTitle}>Delivery that fits the order</Text>
          <Text style={styles.trustMessage}>Pickup is free. If your area needs a quote, we will call before processing the order.</Text>
        </View>
      ) : null}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 110,
    backgroundColor: colors.paper
  },
  brandRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  brand: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900'
  },
  brandSmall: {
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  delivery: {
    flexShrink: 1,
    color: colors.greenDeep,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right'
  },
  hero: {
    minHeight: 330,
    marginTop: spacing.sm,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.goldSoft
  },
  heroCopy: {
    maxWidth: 440
  },
  heroLabel: {
    color: colors.greenDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  heroTitle: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 46
  },
  heroMessage: {
    marginTop: spacing.md,
    color: colors.inkSoft,
    fontSize: 16,
    lineHeight: 24
  },
  stamp: {
    width: 116,
    height: 116,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.green,
    borderRadius: 58,
    transform: [{ rotate: '-8deg' }]
  },
  stampText: {
    color: colors.greenDeep,
    fontSize: 25,
    fontWeight: '900'
  },
  stampSmall: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  sectionHeading: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8
  },
  sectionMessage: {
    marginTop: spacing.xs,
    color: colors.inkSoft,
    fontSize: 15
  },
  filters: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  filter: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.surface
  },
  filterActive: {
    borderColor: colors.greenDeep,
    backgroundColor: colors.greenDeep
  },
  filterPressed: {
    opacity: 0.75
  },
  filterText: {
    color: colors.greenDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  filterTextActive: {
    color: colors.surface
  },
  row: {
    gap: spacing.md
  },
  productCell: {
    marginBottom: spacing.md
  },
  productCellTwo: {
    flex: 1
  },
  trustStrip: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.greenDeep
  },
  trustTitle: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '900'
  },
  trustMessage: {
    marginTop: spacing.sm,
    color: '#D8EADF',
    fontSize: 15,
    lineHeight: 22
  }
})
