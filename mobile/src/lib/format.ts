export const formatPrice = (value: string | number) => {
  const amount = Number(value)
  const hasKobo = Number.isFinite(amount) && amount % 1 !== 0

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: hasKobo ? 2 : 0
  }).format(amount || 0)
}

export const formatKobo = (value: number) => formatPrice(value / 100)

export const formatDate = (value: string) => new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(value))

export const orderStatusLabels: Record<string, string> = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  processing: 'Being prepared',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export const paymentStatusLabels: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded'
}

export const paymentMethodLabels: Record<string, string> = {
  card: 'Card',
  transfer: 'Bank transfer',
  pay_on_delivery: 'Pay on delivery'
}
