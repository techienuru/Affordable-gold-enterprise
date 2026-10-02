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
