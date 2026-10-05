import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import type { DeliveryZone, Order, Product } from '@/types'
import { persistentStorage } from '@/lib/storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)

export const supabase = createClient(
  supabaseUrl || 'https://missing.supabase.co',
  supabaseKey || 'missing-key',
  {
    auth: {
      storage: persistentStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  }
)

const productFields = 'id,name,slug,category,description,price,unit,image_url,stock'

export const getProducts = async (): Promise<Product[]> => {
  if (!hasSupabaseConfig) throw new Error('Add the Supabase settings to mobile/.env first.')

  const { data, error } = await supabase
    .from('products')
    .select(productFields)
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (error) throw error
  return data as Product[]
}

export const getProduct = async (id: string): Promise<Product | null> => {
  if (!hasSupabaseConfig) throw new Error('Add the Supabase settings to mobile/.env first.')

  const { data, error } = await supabase
    .from('products')
    .select(productFields)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as Product | null
}

export const getDeliveryZones = async (): Promise<DeliveryZone[]> => {
  if (!hasSupabaseConfig) throw new Error('Add the Supabase settings to mobile/.env first.')

  const { data, error } = await supabase
    .from('delivery_zones')
    .select('id,name,fee,details,needs_quote')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  if (error) throw error
  return data as DeliveryZone[]
}

export const getMyOrders = async (): Promise<Order[]> => {
  if (!hasSupabaseConfig) throw new Error('Add the Supabase settings to mobile/.env first.')

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

  if (error) throw error
  return data as Order[]
}

export const uploadProductImage = async (uri: string, mimeType: string, fileSize?: number | null) => {
  if (fileSize && fileSize > 2 * 1024 * 1024) {
    throw new Error('The photo must be smaller than 2 MB.')
  }

  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const path = `products/mobile-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const response = await fetch(uri)
  const file = await response.arrayBuffer()
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: mimeType, cacheControl: '3600' })

  if (error) throw error

  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}
