export type Product = {
  id: string
  name: string
  slug: string | null
  category: string | null
  description: string | null
  price: string | number
  unit: string | null
  image_url: string | null
  stock: number
  is_active?: boolean
  updated_at?: string
}

export type DeliveryZone = {
  id: string
  name: string
  fee: string | number
  details: string | null
  needs_quote: boolean
  is_active?: boolean
  sort_order?: number
  updated_at?: string
}

export type CartItem = Product & {
  quantity: number
}

export type OrderItem = {
  id: string
  product_name: string
  unit: string | null
  unit_price: string | number
  quantity: number
  line_total: string | number
}

export type Order = {
  id: string
  order_number: string
  created_at: string
  updated_at?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  status: string
  payment_status: string
  payment_method: string
  fulfilment: string
  delivery_zone_name: string | null
  delivery_address: string | null
  delivery_note?: string | null
  delivery_fee: string | number
  fee_confirmed: boolean
  subtotal: string | number
  total: string | number
  admin_note?: string | null
  order_items: OrderItem[]
}

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: 'customer' | 'admin'
}
