import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasServerSupabaseConfig = Boolean(supabaseUrl && serviceRoleKey)

const supabaseAdmin = hasServerSupabaseConfig
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export const getUserFromAccessToken = async (accessToken) => {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)

  if (error) return null

  return data.user
}

export const isAdminUser = async (userId) => {
  if (!supabaseAdmin) return false

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.role === 'admin'
}

export const saveOrder = async (order) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin.rpc('create_order_for_user', {
    p_user_id: order.userId,
    p_customer_name: order.customerName,
    p_customer_email: order.customerEmail,
    p_customer_phone: order.customerPhone,
    p_fulfilment: order.fulfilment,
    p_delivery_zone_id: order.deliveryZoneId,
    p_delivery_address: order.deliveryAddress,
    p_delivery_note: order.deliveryNote,
    p_payment_method: order.paymentMethod,
    p_items: order.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity
    }))
  })

  if (error) {
    throw error
  }

  return data
}

export const getOrderForEmail = async (orderId) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      fulfilment,
      delivery_zone_name,
      delivery_address,
      delivery_note,
      delivery_fee,
      fee_confirmed,
      subtotal,
      total,
      payment_method,
      order_items (
        product_name,
        unit,
        unit_price,
        quantity,
        line_total
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export const getAdminOrders = async () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      created_at,
      updated_at,
      customer_name,
      customer_email,
      customer_phone,
      fulfilment,
      delivery_zone_name,
      delivery_address,
      delivery_note,
      delivery_fee,
      fee_confirmed,
      subtotal,
      total,
      payment_method,
      payment_status,
      status,
      admin_note,
      order_items (
        id,
        product_name,
        unit,
        unit_price,
        quantity,
        line_total
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export const updateAdminOrder = async (orderId, update) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const values = {
    status: update.status,
    payment_status: update.paymentStatus,
    admin_note: update.adminNote
  }

  if (update.deliveryFee !== null && update.deliveryFee !== undefined) {
    const { data: currentOrder, error: readError } = await supabaseAdmin
      .from('orders')
      .select('subtotal')
      .eq('id', orderId)
      .single()

    if (readError) throw readError

    const subtotalKobo = Math.round(Number(currentOrder.subtotal) * 100)
    const feeKobo = Math.round(Number(update.deliveryFee) * 100)

    values.delivery_fee = update.deliveryFee
    values.fee_confirmed = true
    values.total = ((subtotalKobo + feeKobo) / 100).toFixed(2)
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(values)
    .eq('id', orderId)
    .select('id,status,payment_status,admin_note,delivery_fee,fee_confirmed,subtotal,total,updated_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export const getAdminCatalog = async () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const [productsResult, zonesResult] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id,name,slug,category,description,price,unit,image_url,stock,is_active,updated_at')
      .order('category')
      .order('name'),
    supabaseAdmin
      .from('delivery_zones')
      .select('id,name,fee,details,needs_quote,is_active,sort_order,updated_at')
      .order('sort_order')
      .order('name')
  ])

  if (productsResult.error) throw productsResult.error
  if (zonesResult.error) throw zonesResult.error

  return {
    products: productsResult.data,
    deliveryZones: zonesResult.data
  }
}

export const saveAdminProduct = async (productId, product) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const values = {
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    price: product.price,
    unit: product.unit,
    image_url: product.imageUrl,
    stock: product.stock,
    is_active: product.isActive
  }

  const query = productId
    ? supabaseAdmin.from('products').update(values).eq('id', productId)
    : supabaseAdmin.from('products').insert(values)

  const { data, error } = await query
    .select('id,name,slug,category,description,price,unit,image_url,stock,is_active,updated_at')
    .single()

  if (error) throw error
  return data
}

export const saveAdminDeliveryZone = async (zoneId, zone) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const values = {
    name: zone.name,
    fee: zone.fee,
    details: zone.details,
    needs_quote: zone.needsQuote,
    is_active: zone.isActive,
    sort_order: zone.sortOrder
  }

  const query = zoneId
    ? supabaseAdmin.from('delivery_zones').update(values).eq('id', zoneId)
    : supabaseAdmin.from('delivery_zones').insert(values)

  const { data, error } = await query
    .select('id,name,fee,details,needs_quote,is_active,sort_order,updated_at')
    .single()

  if (error) throw error
  return data
}

export const getOrderForPayment = async (orderId, userId) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id,order_number,user_id,customer_email,total,fee_confirmed,payment_status,paystack_reference')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getOrderByPaystackReference = async (reference) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id,order_number,user_id,customer_email,total,payment_status,paystack_reference')
    .eq('paystack_reference', reference)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getOrderById = async (orderId) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id,order_number,user_id,customer_email,total,payment_status,paystack_reference')
    .eq('id', orderId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const savePaystackReference = async (orderId, reference) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ paystack_reference: reference })
    .eq('id', orderId)
    .neq('payment_status', 'paid')

  if (error) throw error
}

export const markOrderPaid = async (orderId, reference) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      paystack_reference: reference
    })
    .eq('id', orderId)
    .neq('payment_status', 'paid')
    .select('id,order_number,payment_status,status,total')
    .maybeSingle()

  if (error) throw error

  if (data) {
    return { order: data, changed: true }
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from('orders')
    .select('id,order_number,payment_status,status,total')
    .eq('id', orderId)
    .maybeSingle()

  if (readError) throw readError
  return { order: existing, changed: false }
}

export const markOrderPaymentFailed = async (orderId) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', orderId)
    .neq('payment_status', 'paid')

  if (error) throw error
}
