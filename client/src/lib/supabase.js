import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : null

const productFields = [
  'id',
  'name',
  'slug',
  'category',
  'description',
  'price',
  'unit',
  'image_url',
  'stock'
].join(',')

export const getProducts = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase
    .from('products')
    .select(productFields)
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (error) {
    throw error
  }

  return data
}

export const getProduct = async (identifier) => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
  const query = supabase
    .from('products')
    .select(productFields)
    .eq('is_active', true)

  const { data, error } = await (isId
    ? query.eq('id', identifier).maybeSingle()
    : query.eq('slug', identifier).maybeSingle())

  if (error) {
    throw error
  }

  return data
}

export const getDeliveryZones = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase
    .from('delivery_zones')
    .select('id,name,fee,details,needs_quote')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  if (error) {
    throw error
  }

  return data
}

export const getMyOrders = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      created_at,
      status,
      payment_status,
      payment_method,
      fulfilment,
      delivery_zone_name,
      delivery_address,
      delivery_fee,
      fee_confirmed,
      subtotal,
      total,
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

export const uploadProductImage = async (file) => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

  if (!allowedTypes.has(file?.type)) {
    throw new Error('Choose a JPG, PNG, WebP or AVIF photo.')
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('The photo must be smaller than 2 MB.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `products/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600' })

  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
