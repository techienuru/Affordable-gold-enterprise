const cleanText = (value, maximumLength) => typeof value === 'string'
  ? value.trim().slice(0, maximumLength)
  : ''

const cleanMoney = (value) => {
  const amount = String(value ?? '').trim()
  return /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount) ? amount : null
}

const cleanInteger = (value) => {
  const amount = Number(value)
  return Number.isInteger(amount) && amount >= 0 ? amount : null
}

export const validateAdminProduct = (body) => {
  const name = cleanText(body?.name, 160)
  const slug = cleanText(body?.slug, 180).toLowerCase()
  const category = cleanText(body?.category, 100) || null
  const description = cleanText(body?.description, 2000) || null
  const price = cleanMoney(body?.price)
  const unit = cleanText(body?.unit, 80) || null
  const imageUrl = cleanText(body?.imageUrl, 2000) || null
  const stock = cleanInteger(body?.stock)
  const isActive = body?.isActive !== false

  if (!name) {
    return { error: 'Enter the product name.' }
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: 'Use a product link made from lowercase letters, numbers and hyphens.' }
  }

  if (price === null) {
    return { error: 'Enter a valid product price.' }
  }

  if (stock === null) {
    return { error: 'Enter a valid whole-number stock quantity.' }
  }

  return {
    product: {
      name,
      slug,
      category,
      description,
      price,
      unit,
      imageUrl,
      stock,
      isActive
    }
  }
}

export const validateAdminDeliveryZone = (body) => {
  const name = cleanText(body?.name, 160)
  const fee = cleanMoney(body?.fee)
  const details = cleanText(body?.details, 500) || null
  const needsQuote = body?.needsQuote === true
  const isActive = body?.isActive !== false
  const sortOrder = cleanInteger(body?.sortOrder)

  if (!name) {
    return { error: 'Enter the delivery area name.' }
  }

  if (fee === null) {
    return { error: 'Enter a valid delivery fee.' }
  }

  if (sortOrder === null) {
    return { error: 'Enter a valid whole-number display order.' }
  }

  return {
    zone: {
      name,
      fee,
      details,
      needsQuote,
      isActive,
      sortOrder
    }
  }
}
