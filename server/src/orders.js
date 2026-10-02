const allowedFulfilment = new Set(['delivery', 'pickup'])
const allowedPaymentMethods = new Set(['transfer', 'pay_on_delivery'])

const cleanText = (value, maximumLength) => typeof value === 'string'
  ? value.trim().slice(0, maximumLength)
  : ''

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
    return { error: 'Choose bank transfer or pay on delivery.' }
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
