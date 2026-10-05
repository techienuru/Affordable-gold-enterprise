import type { DeliveryZone, Order, Product } from '@/types'

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://affordable-gold-enterprise.vercel.app/api').replace(/\/$/, '')

type ApiOptions = RequestInit & { accessToken?: string | null }

const request = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { accessToken, ...fetchOptions } = options
  const response = await fetch(`${apiUrl}${path}`, {
    ...fetchOptions,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...fetchOptions.headers
    }
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(result.error || 'The request could not be completed.') as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return result as T
}

export type OrderRequest = {
  customerName: string
  customerPhone: string
  fulfilment: 'delivery' | 'pickup'
  deliveryZoneId: string | null
  deliveryAddress: string | null
  deliveryNote: string
  paymentMethod: 'card' | 'transfer' | 'pay_on_delivery'
  items: { productId: string; quantity: number }[]
}

export const createOrder = async (accessToken: string, order: OrderRequest) => {
  const result = await request<{
    order: Order
    notifications: { customerSent: boolean; adminSent: boolean }
  }>('/orders', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(order)
  })

  return { ...result.order, notifications: result.notifications }
}

export const startCardPayment = async (accessToken: string, orderId: string) => request<{
  authorizationUrl: string
  reference: string
  orderNumber: string
  amount: string | number
}>('/payments/paystack/initialize', {
  method: 'POST',
  accessToken,
  body: JSON.stringify({ orderId, platform: 'mobile' })
})

export const verifyCardPayment = async (accessToken: string, reference: string) => request<{
  status: 'paid' | 'pending' | 'failed' | 'mismatch'
  orderNumber: string
  total?: string | number
  message?: string
}>(`/payments/paystack/verify?reference=${encodeURIComponent(reference)}`, { accessToken })

export const getAdminOrders = async (accessToken: string) => {
  const result = await request<{ orders: Order[] }>('/admin/orders', { accessToken })
  return result.orders
}

export const updateAdminOrder = async (accessToken: string, orderId: string, update: {
  status: string
  paymentStatus: string
  adminNote: string
  deliveryFee?: string | number | null
}) => {
  const result = await request<{ order: Partial<Order> & { id: string } }>(`/admin/orders/${orderId}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(update)
  })
  return result.order
}

export const getAdminCatalog = (accessToken: string) => request<{
  products: Product[]
  deliveryZones: DeliveryZone[]
}>('/admin/catalog', { accessToken })

export const saveAdminProduct = async (
  accessToken: string,
  productId: string | null,
  product: Record<string, unknown>
) => {
  const result = await request<{ product: Product }>(productId ? `/admin/products/${productId}` : '/admin/products', {
    method: productId ? 'PATCH' : 'POST',
    accessToken,
    body: JSON.stringify(product)
  })
  return result.product
}

export const saveAdminDeliveryZone = async (
  accessToken: string,
  zoneId: string | null,
  zone: Record<string, unknown>
) => {
  const result = await request<{ deliveryZone: DeliveryZone }>(zoneId ? `/admin/delivery-zones/${zoneId}` : '/admin/delivery-zones', {
    method: zoneId ? 'PATCH' : 'POST',
    accessToken,
    body: JSON.stringify(zone)
  })
  return result.deliveryZone
}
