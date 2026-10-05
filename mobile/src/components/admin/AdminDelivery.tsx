import { useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import AppButton from '@/components/AppButton'
import FormField from '@/components/FormField'
import { colors, radius, spacing } from '@/constants/brand'
import { saveAdminDeliveryZone } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import type { DeliveryZone } from '@/types'

const emptyZone: DeliveryZone = {
  id: '',
  name: '',
  fee: '',
  details: '',
  needs_quote: false,
  is_active: true,
  sort_order: 0
}

function DeliveryEditor({ zone, accessToken, onSaved, onCancel }: {
  zone: DeliveryZone
  accessToken: string
  onSaved: (zone: DeliveryZone) => void
  onCancel: () => void
}) {
  const isNew = !zone.id
  const [name, setName] = useState(zone.name)
  const [fee, setFee] = useState(String(zone.fee))
  const [details, setDetails] = useState(zone.details || '')
  const [sortOrder, setSortOrder] = useState(String(zone.sort_order || 0))
  const [needsQuote, setNeedsQuote] = useState(zone.needs_quote)
  const [active, setActive] = useState(zone.is_active !== false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const save = async () => {
    setSaving(true)
    setMessage('')

    try {
      const saved = await saveAdminDeliveryZone(accessToken, zone.id || null, {
        name,
        fee,
        details,
        needsQuote,
        isActive: active,
        sortOrder
      })
      onSaved(saved)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The delivery area could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>{isNew ? 'New delivery area' : `Edit ${zone.name}`}</Text>
      <FormField label="Delivery area" value={name} onChangeText={setName} />
      <FormField label="Fee in naira" value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
      <FormField label="Display order" value={sortOrder} onChangeText={setSortOrder} keyboardType="number-pad" />
      <FormField label="Customer message" value={details} onChangeText={setDetails} multiline numberOfLines={3} />
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>Confirm fee by phone</Text>
          <Text style={styles.switchMessage}>The customer can order, but card payment waits for a confirmed fee.</Text>
        </View>
        <Switch value={needsQuote} onValueChange={setNeedsQuote} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.surface} />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>Show at checkout</Text>
          <Text style={styles.switchMessage}>Turn this off to hide the area without deleting it.</Text>
        </View>
        <Switch value={active} onValueChange={setActive} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.surface} />
      </View>
      {message ? <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text> : null}
      <View style={styles.actions}>
        <AppButton label="Cancel" variant="outline" onPress={onCancel} style={styles.action} />
        <AppButton label={isNew ? 'Add area' : 'Save area'} loading={saving} onPress={save} style={styles.action} />
      </View>
    </View>
  )
}

export default function AdminDelivery({ zones, accessToken, onSaved }: {
  zones: DeliveryZone[]
  accessToken: string
  onSaved: (zone: DeliveryZone) => void
}) {
  const [editing, setEditing] = useState<DeliveryZone | null>(null)
  const [adding, setAdding] = useState(false)

  if (adding) {
    return <DeliveryEditor zone={emptyZone} accessToken={accessToken} onSaved={(zone) => { onSaved(zone); setAdding(false) }} onCancel={() => setAdding(false)} />
  }

  if (editing) {
    return <DeliveryEditor zone={editing} accessToken={accessToken} onSaved={(zone) => { onSaved(zone); setEditing(null) }} onCancel={() => setEditing(null)} />
  }

  return (
    <View style={styles.list}>
      <AppButton label="Add delivery area" onPress={() => setAdding(true)} />
      {zones.map((zone) => (
        <Pressable
          key={zone.id}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${zone.name}`}
          onPress={() => setEditing(zone)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardCopy}>
            <Text style={styles.cardName}>{zone.name}</Text>
            <Text style={styles.cardMeta}>{zone.needs_quote ? 'Fee confirmed by phone' : formatPrice(zone.fee)}</Text>
            <Text style={[styles.state, zone.is_active !== false && styles.active]}>{zone.is_active === false ? 'Hidden' : 'Active'}</Text>
          </View>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  card: {
    minHeight: 92,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  pressed: {
    backgroundColor: colors.goldSoft
  },
  cardCopy: {
    flex: 1
  },
  cardName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  cardMeta: {
    marginTop: 4,
    color: colors.inkSoft,
    fontSize: 13
  },
  state: {
    marginTop: 7,
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '900'
  },
  active: {
    color: colors.green
  },
  edit: {
    color: colors.greenDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  editor: {
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  editorTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '900'
  },
  switchRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  switchCopy: {
    flex: 1
  },
  switchTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  switchMessage: {
    marginTop: 3,
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 17
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  action: {
    flex: 1
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  }
})
