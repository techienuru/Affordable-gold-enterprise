import { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import AppButton from '@/components/AppButton'
import PageHeader from '@/components/PageHeader'
import Screen from '@/components/Screen'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { useAuth } from '@/context/AuthContext'
import { startCardPayment, verifyCardPayment } from '@/lib/api'
import { formatDate, formatPrice, orderStatusLabels, paymentMethodLabels, paymentStatusLabels } from '@/lib/format'
import { getMyOrders } from '@/lib/supabase'
import type { Order } from '@/types'

export default function OrdersScreen() {
  const { user, accessToken, loading: authLoading, signInWithGoogle } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [payingId, setPayingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setState('loading')

    try {
      setOrders(await getMyOrders())
      setState('ready')
    } catch {
      setState('error')
    }
  }, [user])

  useFocusEffect(useCallback(() => {
    if (user) load()
  }, [user, load]))

  const payNow = async (order: Order) => {
    if (!accessToken) return
    setPayingId(order.id)

    try {
      const payment = await startCardPayment(accessToken, order.id)
      const returnUrl = Linking.createURL('payment/return')
      const browser = await WebBrowser.openAuthSessionAsync(payment.authorizationUrl, returnUrl)

      if (browser.type === 'success') {
        const result = await verifyCardPayment(accessToken, payment.reference)

        if (result.status === 'paid') {
          Alert.alert('Payment confirmed', `${result.orderNumber} is now marked as paid.`)
        } else {
          Alert.alert('Payment not confirmed yet', result.message || 'Check this order again in a moment.')
        }
      }

      await load()
    } catch (error) {
      Alert.alert('Payment could not start', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setPayingId(null)
    }
  }

  if (authLoading) {
    return <Screen><StatusPanel title="Checking your account" message="Your orders will appear shortly." loading /></Screen>
  }

  if (!user) {
    return (
      <Screen>
        <PageHeader eyebrow="Your account" title="Orders" message="Sign in with the same Google account used at checkout." />
        <StatusPanel title="Sign in to see your orders" message="Your order history is private to your account." actionLabel="Sign in with Google" onAction={signInWithGoogle} />
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader eyebrow="Your account" title="Orders" message="Track orders and complete pending card payments." />

      {state === 'loading' && <StatusPanel title="Loading your orders" message="Checking the latest status." loading />}
      {state === 'error' && <StatusPanel title="Orders could not be loaded" message="Check your connection and try again." actionLabel="Try again" onAction={load} />}
      {state === 'ready' && orders.length === 0 && <StatusPanel title="No orders yet" message="Completed checkouts will appear here." />}

      {state === 'ready' && orders.length > 0 && (
        <View style={styles.list}>
          {orders.map((order) => (
            <View style={styles.card} key={order.id}>
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={styles.date}>{formatDate(order.created_at)}</Text>
                  <Text style={styles.number}>{order.order_number}</Text>
                </View>
                <Text style={styles.total}>{formatPrice(order.total)}</Text>
              </View>

              <View style={styles.badges}>
                <View style={styles.badge}><Text style={styles.badgeText}>{orderStatusLabels[order.status] || order.status}</Text></View>
                <View style={[styles.badge, order.payment_status === 'paid' && styles.badgePaid]}>
                  <Text style={styles.badgeText}>{paymentStatusLabels[order.payment_status] || order.payment_status}</Text>
                </View>
              </View>

              <View style={styles.items}>
                {order.order_items.map((item) => (
                  <View style={styles.item} key={item.id}>
                    <Text style={styles.itemName}>{item.quantity} × {item.product_name}</Text>
                    <Text style={styles.itemTotal}>{formatPrice(item.line_total)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.facts}>
                <Text style={styles.fact}>Payment: {paymentMethodLabels[order.payment_method] || order.payment_method}</Text>
                <Text style={styles.fact}>Fulfilment: {order.fulfilment === 'pickup' ? 'Pickup' : order.delivery_zone_name}</Text>
                <Text style={styles.fact}>Delivery fee: {order.fee_confirmed ? formatPrice(order.delivery_fee) : 'To be confirmed'}</Text>
              </View>

              {order.payment_method === 'card' && order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                order.fee_confirmed
                  ? <AppButton label={payingId === order.id ? 'Opening Paystack...' : 'Pay now'} loading={payingId === order.id} onPress={() => payNow(order)} style={styles.payButton} />
                  : <Text style={styles.quote}>We will confirm the delivery fee before card payment is available.</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  headerCopy: {
    flex: 1
  },
  date: {
    color: colors.inkSoft,
    fontSize: 12
  },
  number: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  total: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  badges: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft
  },
  badgePaid: {
    backgroundColor: colors.greenSoft
  },
  badgeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900'
  },
  items: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  item: {
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  itemName: {
    flex: 1,
    color: colors.ink,
    fontSize: 14
  },
  itemTotal: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  facts: {
    marginTop: spacing.md,
    gap: spacing.xs
  },
  fact: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19
  },
  payButton: {
    marginTop: spacing.md
  },
  quote: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    color: colors.greenDeep,
    backgroundColor: colors.greenSoft,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  }
})
