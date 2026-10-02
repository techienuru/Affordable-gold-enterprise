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
