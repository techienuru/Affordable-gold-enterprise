const allowedFulfilment = new Set(['delivery', 'pickup'])
const allowedPaymentMethods = new Set(['card', 'transfer', 'pay_on_delivery'])
const allowedOrderStatuses = new Set([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
])
const allowedPaymentStatuses = new Set(['pending', 'paid', 'failed', 'refunded'])

const cleanText = (value, maximumLength) => typeof value === 'string'
  ? value.trim().slice(0, maximumLength)
  : ''

const cleanMoney = (value) => {
  const amount = String(value ?? '').trim()
  return /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount) ? amount : null
}

export const validateOrderRequest = (body) => {
  const customerName = cleanText(body?.customerName, 120)
  const customerPhone = cleanText(body?.customerPhone, 40)
  const fulfilment = cleanText(body?.fulfilment, 20)
  const deliveryZoneId = cleanText(body?.deliveryZoneId, 50) || null
  const deliveryAddress = cleanText(body?.deliveryAddress, 500) || null
  const deliveryNote = cleanText(body?.deliveryNote, 500) || null
  const paymentMethod = cleanText(body?.paymentMethod, 30)
  const items = Array.isArray(body?.items) ? body.items : []

  if (!customerName || !customerPhone) {
    return { error: 'Enter your name and phone number.' }
  }

  if (!allowedFulfilment.has(fulfilment)) {
    return { error: 'Choose delivery or pickup.' }
  }

  if (fulfilment === 'delivery' && (!deliveryZoneId || !deliveryAddress)) {
    return { error: 'Choose a delivery area and enter the delivery address.' }
  }

  if (!allowedPaymentMethods.has(paymentMethod)) {
    return { error: 'Choose card, bank transfer or pay on delivery.' }
  }

  if (items.length === 0 || items.length > 100) {
    return { error: 'Your cart must contain between 1 and 100 products.' }
  }

  const cleanItems = []

  for (const item of items) {
    const productId = cleanText(item?.productId, 50)
    const quantity = Number(item?.quantity)

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return { error: 'One of the products in your cart is invalid.' }
    }

    cleanItems.push({ productId, quantity })
  }

  return {
    order: {
      customerName,
      customerPhone,
      fulfilment,
      deliveryZoneId: fulfilment === 'delivery' ? deliveryZoneId : null,
      deliveryAddress: fulfilment === 'delivery' ? deliveryAddress : null,
      deliveryNote,
      paymentMethod,
      items: cleanItems
    }
  }
}

export const validateAdminOrderUpdate = (body) => {
  const status = cleanText(body?.status, 30)
  const paymentStatus = cleanText(body?.paymentStatus, 30)
  const adminNote = cleanText(body?.adminNote, 1000) || null
  const feeGiven = body?.deliveryFee !== undefined
    && body?.deliveryFee !== null
    && String(body.deliveryFee).trim() !== ''
  const deliveryFee = cleanMoney(body?.deliveryFee)

  if (!allowedOrderStatuses.has(status)) {
    return { error: 'Choose a valid order status.' }
  }

  if (!allowedPaymentStatuses.has(paymentStatus)) {
    return { error: 'Choose a valid payment status.' }
  }

  if (feeGiven && deliveryFee === null) {
    return { error: 'Enter a valid delivery fee, for example 2500 or 2500.50.' }
  }

  return {
    update: {
      status,
      paymentStatus,
      adminNote,
      deliveryFee: feeGiven ? deliveryFee : null
    }
  }
}
