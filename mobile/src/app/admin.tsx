import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import AdminDelivery from '@/components/admin/AdminDelivery'
import AdminOrders from '@/components/admin/AdminOrders'
import AdminProducts from '@/components/admin/AdminProducts'
import PageHeader from '@/components/PageHeader'
import Screen from '@/components/Screen'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { useAuth } from '@/context/AuthContext'
import { getAdminCatalog, getAdminOrders } from '@/lib/api'
import type { DeliveryZone, Order, Product } from '@/types'

type Section = 'orders' | 'products' | 'delivery'

export default function AdminScreen() {
  const { user, accessToken, profile, loading: authLoading, profileLoading, signInWithGoogle } = useAuth()
  const [section, setSection] = useState<Section>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = async () => {
    if (!accessToken || profile?.role !== 'admin') return
    setState('loading')

    try {
      const [orderData, catalog] = await Promise.all([
        getAdminOrders(accessToken),
        getAdminCatalog(accessToken)
      ])
      setOrders(orderData)
      setProducts(catalog.products)
      setZones(catalog.deliveryZones)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    if (!accessToken || profile?.role !== 'admin') return
    let active = true

    Promise.all([
      getAdminOrders(accessToken),
      getAdminCatalog(accessToken)
    ])
      .then(([orderData, catalog]) => {
        if (!active) return
        setOrders(orderData)
        setProducts(catalog.products)
        setZones(catalog.deliveryZones)
        setState('ready')
      })
      .catch(() => {
        if (active) setState('error')
      })

    return () => {
      active = false
    }
  }, [accessToken, profile?.role])

  if (authLoading || profileLoading) {
    return <Screen><StatusPanel title="Checking admin access" message="This will only take a moment." loading /></Screen>
  }

  if (!user) {
    return <Screen><StatusPanel title="Admin sign-in required" message="Use the Google account assigned as an admin." actionLabel="Sign in with Google" onAction={signInWithGoogle} /></Screen>
  }

  if (profile?.role !== 'admin') {
    return <Screen><StatusPanel title="Admin access is not enabled" message="This account does not have the admin role in Supabase." /></Screen>
  }

  return (
    <Screen keyboard>
      <PageHeader eyebrow="Back office" title="Shop admin" message="Manage orders, products and delivery settings." />

      <View style={styles.tabs} accessibilityRole="tablist">
        {([
          ['orders', 'Orders'],
          ['products', 'Products'],
          ['delivery', 'Delivery']
        ] as [Section, string][]).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === value }}
            onPress={() => setSection(value)}
            style={({ pressed }) => [styles.tab, section === value && styles.tabActive, pressed && styles.pressed]}
          >
            <Text style={[styles.tabText, section === value && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {section === 'orders' && state === 'ready' && (
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNumber}>{orders.length}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length}</Text><Text style={styles.statLabel}>Open</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{orders.filter((order) => order.payment_status === 'pending').length}</Text><Text style={styles.statLabel}>Awaiting payment</Text></View>
        </View>
      )}

      {state === 'loading' && <StatusPanel title="Loading shop admin" message="Fetching the latest information." loading />}
      {state === 'error' && <StatusPanel title="Admin information could not be loaded" message="Check the API connection and try again." actionLabel="Try again" onAction={load} />}

      {state === 'ready' && section === 'orders' && (
        <AdminOrders
          orders={orders}
          accessToken={accessToken!}
          onUpdated={(update) => setOrders((current) => current.map((order) => order.id === update.id ? { ...order, ...update } : order))}
        />
      )}
      {state === 'ready' && section === 'products' && (
        <AdminProducts
          products={products}
          accessToken={accessToken!}
          onSaved={(saved) => setProducts((current) => current.some((product) => product.id === saved.id)
            ? current.map((product) => product.id === saved.id ? saved : product)
            : [...current, saved])}
        />
      )}
      {state === 'ready' && section === 'delivery' && (
        <AdminDelivery
          zones={zones}
          accessToken={accessToken!}
          onSaved={(saved) => setZones((current) => current.some((zone) => zone.id === saved.id)
            ? current.map((zone) => zone.id === saved.id ? saved : zone)
            : [...current, saved])}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabs: {
    marginBottom: spacing.lg,
    padding: 5,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: '#F8F3E8'
  },
  tab: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm
  },
  tabActive: {
    backgroundColor: colors.greenDeep
  },
  pressed: {
    opacity: 0.72
  },
  tabText: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: '900'
  },
  tabTextActive: {
    color: colors.surface
  },
  stats: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm
  },
  stat: {
    minHeight: 82,
    padding: spacing.sm,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  statNumber: {
    color: colors.greenDeep,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center'
  },
  statLabel: {
    marginTop: 3,
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center'
  }
})
