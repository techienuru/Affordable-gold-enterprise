const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export const createOrder = async (accessToken, order) => {
  const response = await fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || 'Your order could not be saved. Please try again.')
  }

  return {
    ...result.order,
    notifications: result.notifications
  }
}

const adminRequest = async (accessToken, path, options = {}) => {
  const response = await fetch(`${apiUrl}/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(result.error || 'The admin request could not be completed.')
    error.status = response.status
    throw error
  }

  return result
}

export const getAdminOrders = async (accessToken) => {
  const result = await adminRequest(accessToken, '/orders')
  return result.orders
}

export const updateAdminOrder = async (accessToken, orderId, update) => {
  const result = await adminRequest(accessToken, `/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  })

  return result.order
}

export const getAdminCatalog = async (accessToken) => {
  return adminRequest(accessToken, '/catalog')
}

export const saveAdminProduct = async (accessToken, productId, product) => {
  const result = await adminRequest(accessToken, productId ? `/products/${productId}` : '/products', {
    method: productId ? 'PATCH' : 'POST',
    body: JSON.stringify(product)
  })

  return result.product
}

export const saveAdminDeliveryZone = async (accessToken, zoneId, zone) => {
  const result = await adminRequest(accessToken, zoneId ? `/delivery-zones/${zoneId}` : '/delivery-zones', {
    method: zoneId ? 'PATCH' : 'POST',
    body: JSON.stringify(zone)
  })

  return result.deliveryZone
}
