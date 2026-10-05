import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import AppButton from '@/components/AppButton'
import ChoiceCard from '@/components/ChoiceCard'
import FormField from '@/components/FormField'
import { colors, radius, spacing } from '@/constants/brand'
import { updateAdminOrder } from '@/lib/api'
import { formatDate, formatPrice, orderStatusLabels, paymentStatusLabels } from '@/lib/format'
import type { Order } from '@/types'

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded']

function AdminOrderCard({ order, accessToken, onSaved }: {
  order: Order
  accessToken: string
  onSaved: (update: Partial<Order> & { id: string }) => void
}) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [deliveryFee, setDeliveryFee] = useState(order.fee_confirmed ? String(order.delivery_fee) : '')
  const [note, setNote] = useState(order.admin_note || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const save = async () => {
    setSaving(true)
    setMessage('')

    try {
      const update = await updateAdminOrder(accessToken, order.id, {
        status,
        paymentStatus,
        adminNote: note,
        deliveryFee: deliveryFee.trim() || null
      })
      onSaved(update)
      setMessage('Changes saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The order could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.date}>{formatDate(order.created_at)}</Text>
          <Text style={styles.number}>{order.order_number}</Text>
        </View>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
      </View>

      <View style={styles.customer}>
        <Text style={styles.customerName}>{order.customer_name}</Text>
        <Text style={styles.customerLine}>{order.customer_email}</Text>
        <Text style={styles.customerLine}>{order.customer_phone}</Text>
        <Text style={styles.customerLine}>{order.fulfilment === 'pickup' ? 'Pickup' : `${order.delivery_zone_name} · ${order.delivery_address}`}</Text>
      </View>

      <Text style={styles.groupLabel}>Order status</Text>
      <View style={styles.choices}>
        {orderStatuses.map((value) => (
          <ChoiceCard
            key={value}
            title={orderStatusLabels[value]}
            message=""
            selected={status === value}
            onPress={() => setStatus(value)}
          />
        ))}
      </View>

      <Text style={styles.groupLabel}>Payment status</Text>
      <View style={styles.choices}>
        {paymentStatuses.map((value) => (
          <ChoiceCard
            key={value}
            title={paymentStatusLabels[value]}
            message=""
            selected={paymentStatus === value}
            onPress={() => setPaymentStatus(value)}
          />
        ))}
      </View>

      {!order.fee_confirmed && (
        <FormField
          label="Confirmed delivery fee"
          hint="Entering a fee confirms it for the customer."
          value={deliveryFee}
          onChangeText={setDeliveryFee}
          keyboardType="decimal-pad"
          placeholder="For example: 2500"
        />
      )}
      <FormField label="Private admin note" value={note} onChangeText={setNote} multiline numberOfLines={3} />
      {message ? <Text style={[styles.message, !message.includes('saved') && styles.error]} accessibilityLiveRegion="polite">{message}</Text> : null}
      <AppButton label="Save changes" loading={saving} onPress={save} />
    </View>
  )
}

export default function AdminOrders({ orders, accessToken, onUpdated }: {
  orders: Order[]
  accessToken: string
  onUpdated: (update: Partial<Order> & { id: string }) => void
}) {
  if (orders.length === 0) {
    return <Text style={styles.empty}>New customer orders will appear here.</Text>
  }

  return (
    <View style={styles.list}>
      {orders.map((order) => (
        <AdminOrderCard order={order} accessToken={accessToken} onSaved={onUpdated} key={order.id} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg
  },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  header: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.greenDeep
  },
  headerCopy: {
    flex: 1
  },
  date: {
    color: '#D8EADF',
    fontSize: 12
  },
  number: {
    marginTop: 3,
    color: colors.surface,
    fontSize: 17,
    fontWeight: '900'
  },
  total: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900'
  },
  customer: {
    gap: 4
  },
  customerName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  customerLine: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19
  },
  groupLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  choices: {
    gap: spacing.sm
  },
  message: {
    color: colors.greenDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  error: {
    color: colors.danger
  },
  empty: {
    padding: spacing.lg,
    color: colors.inkSoft,
    fontSize: 15,
    textAlign: 'center'
  }
})
