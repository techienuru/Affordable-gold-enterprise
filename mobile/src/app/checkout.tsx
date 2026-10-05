import { useEffect, useMemo, useState } from 'react'
import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import AppButton from '@/components/AppButton'
import ChoiceCard from '@/components/ChoiceCard'
import FormField from '@/components/FormField'
import PageHeader from '@/components/PageHeader'
import Screen from '@/components/Screen'
import StatusPanel from '@/components/StatusPanel'
import { colors, radius, spacing } from '@/constants/brand'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createOrder, startCardPayment, verifyCardPayment } from '@/lib/api'
import { formatKobo, formatPrice } from '@/lib/format'
import { getDeliveryZones } from '@/lib/supabase'
import type { DeliveryZone } from '@/types'

type Confirmation = {
  orderNumber: string
  total: string | number
  paymentStatus: string
  emailSent: boolean
}

export default function CheckoutScreen() {
  const { user, accessToken, profile, loading: authLoading, signInWithGoogle } = useAuth()
  const { items, subtotalKobo, clearCart } = useCart()
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [zoneState, setZoneState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [name, setName] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [fulfilment, setFulfilment] = useState<'delivery' | 'pickup'>('delivery')
  const [zoneId, setZoneId] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'pay_on_delivery'>('transfer')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  useEffect(() => {
    getDeliveryZones()
      .then((data) => {
        setZones(data)
        setZoneId(data[0]?.id || '')
        setZoneState('ready')
      })
      .catch(() => setZoneState('error'))
  }, [])

  const selectedZone = zones.find((zone) => zone.id === zoneId)
  const needsQuote = fulfilment === 'delivery' && Boolean(selectedZone?.needs_quote)
  const deliveryFeeKobo = fulfilment === 'delivery' && selectedZone && !needsQuote
    ? Math.round(Number(selectedZone.fee) * 100)
    : 0
  const totalKobo = subtotalKobo + deliveryFeeKobo
  const cardAvailable = !needsQuote && (fulfilment === 'pickup' || Boolean(selectedZone))
  const selectedPaymentMethod = !cardAvailable && paymentMethod === 'card' ? 'transfer' : paymentMethod
  const customerName = name ?? profile?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
  const customerPhone = phone ?? profile?.phone ?? ''

  const validation = useMemo(() => {
    if (!customerName.trim()) return 'Enter your name.'
    if (!customerPhone.trim()) return 'Enter your phone number.'
    if (fulfilment === 'delivery' && !zoneId) return 'Choose a delivery area.'
    if (fulfilment === 'delivery' && !address.trim()) return 'Enter the delivery address.'
    return ''
  }, [customerName, customerPhone, fulfilment, zoneId, address])

  const placeOrder = async () => {
    if (!accessToken || validation) {
      setError(validation || 'Sign in before placing the order.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const saved = await createOrder(accessToken, {
        customerName,
        customerPhone,
        fulfilment,
        deliveryZoneId: fulfilment === 'delivery' ? zoneId : null,
        deliveryAddress: fulfilment === 'delivery' ? address : null,
        deliveryNote: note,
        paymentMethod: selectedPaymentMethod,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
      })

      clearCart()
      let paymentStatus = saved.payment_status

      if (selectedPaymentMethod === 'card') {
        const payment = await startCardPayment(accessToken, saved.id)
        const returnUrl = Linking.createURL('payment/return')
        const browser = await WebBrowser.openAuthSessionAsync(payment.authorizationUrl, returnUrl)

        if (browser.type === 'success') {
          const result = await verifyCardPayment(accessToken, payment.reference)
          paymentStatus = result.status
        }
      }

      setConfirmation({
        orderNumber: saved.order_number,
        total: saved.total,
        paymentStatus,
        emailSent: Boolean(saved.notifications?.customerSent)
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The order could not be placed.')
    } finally {
      setSaving(false)
    }
  }

  if (confirmation) {
    return (
      <Screen>
        <StatusPanel
          title="Your order has been received"
          message={`${confirmation.orderNumber} has been saved. The total is ${formatPrice(confirmation.total)}.${confirmation.paymentStatus === 'paid' ? ' Card payment confirmed.' : ''}${confirmation.emailSent ? '' : ' The confirmation email could not be sent.'}`}
          actionLabel="View your orders"
          onAction={() => router.replace('/orders')}
        />
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen>
        <StatusPanel title="Your cart is empty" message="Add at least one product before checkout." actionLabel="Browse the shop" onAction={() => router.replace('/')} />
      </Screen>
    )
  }

  if (authLoading) {
    return <Screen><StatusPanel title="Checking your account" message="Preparing checkout." loading /></Screen>
  }

  if (!user) {
    return (
      <Screen>
        <PageHeader eyebrow="Secure checkout" title="Sign in first" message="Google sign-in connects this order to your history." />
        <StatusPanel title="Ready when you are" message="Your cart will stay here after sign-in." actionLabel="Sign in with Google" onAction={signInWithGoogle} />
      </Screen>
    )
  }

  return (
    <Screen keyboard>
      <PageHeader eyebrow="Secure checkout" title="Complete your order" message="We check every price and delivery fee again on the server." />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact details</Text>
        <FormField label="Full name" value={customerName} onChangeText={setName} autoComplete="name" />
        <FormField label="Phone number" value={customerPhone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
        <View style={styles.signedIn}>
          <Text style={styles.signedInLabel}>Signed in as</Text>
          <Text style={styles.signedInEmail}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fulfilment</Text>
        <ChoiceCard title="Delivery" message="Choose your area and enter an address." selected={fulfilment === 'delivery'} onPress={() => setFulfilment('delivery')} />
        <ChoiceCard title="Pickup" message="Free pickup. We will confirm the collection details." selected={fulfilment === 'pickup'} onPress={() => setFulfilment('pickup')} />

        {fulfilment === 'delivery' && (
          <>
            <Text style={styles.label}>Delivery area</Text>
            {zoneState === 'loading' && <Text style={styles.helper}>Loading delivery areas...</Text>}
            {zoneState === 'error' && <Text style={styles.errorText}>Delivery areas could not be loaded.</Text>}
            {zones.map((zone) => (
              <ChoiceCard
                key={zone.id}
                title={zone.name}
                message={zone.needs_quote ? 'We will call to confirm the fee.' : `${formatPrice(zone.fee)} · ${zone.details || 'Delivery available'}`}
                selected={zoneId === zone.id}
                onPress={() => setZoneId(zone.id)}
              />
            ))}
            <FormField label="Delivery address" value={address} onChangeText={setAddress} multiline numberOfLines={3} />
          </>
        )}

        <FormField label="Order note (optional)" value={note} onChangeText={setNote} placeholder="For example: call when you arrive" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <ChoiceCard title="Card" message={cardAvailable ? 'Pay securely with Paystack.' : 'We must confirm the delivery fee first.'} selected={selectedPaymentMethod === 'card'} disabled={!cardAvailable} onPress={() => setPaymentMethod('card')} />
        <ChoiceCard title="Bank transfer" message="Payment stays pending until an admin confirms it." selected={selectedPaymentMethod === 'transfer'} onPress={() => setPaymentMethod('transfer')} />
        <ChoiceCard title="Pay on delivery" message="We will call to confirm the order." selected={selectedPaymentMethod === 'pay_on_delivery'} onPress={() => setPaymentMethod('pay_on_delivery')} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Products</Text><Text style={styles.summaryValue}>{formatKobo(subtotalKobo)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={styles.summaryValue}>{needsQuote ? 'To be confirmed' : formatKobo(deliveryFeeKobo)}</Text></View>
        <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Current total</Text><Text style={styles.totalValue}>{formatKobo(totalKobo)}</Text></View>
        {needsQuote && <Text style={styles.quote}>We will call before processing the order and add the confirmed delivery fee.</Text>}
      </View>

      {error ? <Text style={styles.orderError} accessibilityLiveRegion="assertive">{error}</Text> : null}
      <AppButton label={saving ? 'Saving order...' : selectedPaymentMethod === 'card' ? 'Save order and pay' : 'Place order'} loading={saving} disabled={Boolean(validation) || zoneState === 'error'} onPress={placeOrder} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900'
  },
  signedIn: {
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.greenSoft
  },
  signedInLabel: {
    color: colors.greenDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  signedInEmail: {
    marginTop: 3,
    color: colors.greenDeep,
    fontSize: 14
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  helper: {
    color: colors.inkSoft,
    fontSize: 14
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700'
  },
  summary: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  summaryLabel: {
    color: colors.inkSoft,
    fontSize: 14
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  totalLabel: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  totalValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  quote: {
    marginTop: spacing.sm,
    padding: 12,
    borderRadius: radius.sm,
    color: colors.greenDeep,
    backgroundColor: colors.greenSoft,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  orderError: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  }
})
