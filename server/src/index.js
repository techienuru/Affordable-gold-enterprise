import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import {
  getAdminCatalog,
  getAdminOrders,
  getOrderForEmail,
  getUserFromAccessToken,
  hasServerSupabaseConfig,
  isAdminUser,
  saveOrder,
  saveAdminDeliveryZone,
  saveAdminProduct,
  updateAdminOrder
} from './supabase.js'
import { validateAdminOrderUpdate, validateOrderRequest } from './orders.js'
import { validateAdminDeliveryZone, validateAdminProduct } from './admin.js'
import { sendOrderEmails } from './email.js'

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json())

// Settings the server cannot work without.
// Listed so /api/health can tell you what is still blank.
const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'PAYSTACK_SECRET_KEY',
  'MAILGUN_API_KEY',
  'MAILGUN_DOMAIN',
  'MAILGUN_FROM_EMAIL',
  'ORDER_ALERT_EMAIL',
]

const missingEnv = () => REQUIRED_ENV.filter((key) => !process.env[key])

const getAccessToken = (req) => {
  const authorization = req.get('authorization') || ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

const requireAdmin = async (req, res, next) => {
  if (!hasServerSupabaseConfig) {
    return res.status(503).json({ error: 'Admin access is not configured yet.' })
  }

  const user = await getUserFromAccessToken(getAccessToken(req))

  if (!user) {
    return res.status(401).json({ error: 'Sign in before opening the admin area.' })
  }

  try {
    if (!await isAdminUser(user.id)) {
      return res.status(403).json({ error: 'This account does not have admin access.' })
    }
  } catch {
    return res.status(503).json({ error: 'Admin access could not be checked.' })
  }

  req.authUser = user
  return next()
}

app.get('/api/health', (_req, res) => {
  const missing = missingEnv()
  res.json({
    ok: true,
    service: 'affordable-gold-api',
    time: new Date().toISOString(),
    setupComplete: missing.length === 0,
    missingEnv: missing,
  })
})

app.post('/api/orders', async (req, res) => {
  if (!hasServerSupabaseConfig) {
    return res.status(503).json({ error: 'Order saving is not configured yet.' })
  }

  const accessToken = getAccessToken(req)

  if (!accessToken) {
    return res.status(401).json({ error: 'Sign in with Google before placing your order.' })
  }

  const user = await getUserFromAccessToken(accessToken)

  if (!user?.email) {
    return res.status(401).json({ error: 'Your sign-in has expired. Sign in again.' })
  }

  const { order, error } = validateOrderRequest(req.body)

  if (error) {
    return res.status(400).json({ error })
  }

  let savedOrder

  try {
    savedOrder = await saveOrder({
      ...order,
      userId: user.id,
      customerEmail: user.email
    })
  } catch (saveError) {
    console.error('Order creation failed:', saveError.message)
    return res.status(409).json({
      error: 'A product or delivery detail changed. Review your order and try again.'
    })
  }

  let notifications = { customerSent: false, adminSent: false }

  try {
    const orderDetails = await getOrderForEmail(savedOrder.id)
    notifications = await sendOrderEmails(orderDetails)

    if (!notifications.customerSent || !notifications.adminSent) {
      console.error('One or more order emails could not be sent:', savedOrder.order_number)
    }
  } catch (emailError) {
    console.error('Order email preparation failed:', emailError.message)
  }

  return res.status(201).json({ order: savedOrder, notifications })
})

app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
  try {
    const orders = await getAdminOrders()
    return res.json({ orders })
  } catch (error) {
    console.error('Admin orders could not be loaded:', error.message)
    return res.status(500).json({ error: 'Orders could not be loaded.' })
  }
})

app.patch('/api/admin/orders/:orderId', requireAdmin, async (req, res) => {
  const { update, error } = validateAdminOrderUpdate(req.body)

  if (error) {
    return res.status(400).json({ error })
  }

  try {
    const order = await updateAdminOrder(req.params.orderId, update)
    return res.json({ order })
  } catch (updateError) {
    console.error('Admin order update failed:', updateError.message)
    return res.status(404).json({ error: 'The order could not be updated.' })
  }
})

app.get('/api/admin/catalog', requireAdmin, async (_req, res) => {
  try {
    return res.json(await getAdminCatalog())
  } catch (error) {
    console.error('Admin catalogue could not be loaded:', error.message)
    return res.status(500).json({ error: 'Products and delivery areas could not be loaded.' })
  }
})

const saveProduct = async (req, res) => {
  const { product, error } = validateAdminProduct(req.body)

  if (error) return res.status(400).json({ error })

  try {
    const savedProduct = await saveAdminProduct(req.params.productId || null, product)
    return res.status(req.params.productId ? 200 : 201).json({ product: savedProduct })
  } catch (saveError) {
    console.error('Admin product save failed:', saveError.message)
    const message = saveError.code === '23505'
      ? 'That product link is already being used.'
      : 'The product could not be saved.'
    return res.status(409).json({ error: message })
  }
}

app.post('/api/admin/products', requireAdmin, saveProduct)
app.patch('/api/admin/products/:productId', requireAdmin, saveProduct)

const saveDeliveryZone = async (req, res) => {
  const { zone, error } = validateAdminDeliveryZone(req.body)

  if (error) return res.status(400).json({ error })

  try {
    const savedZone = await saveAdminDeliveryZone(req.params.zoneId || null, zone)
    return res.status(req.params.zoneId ? 200 : 201).json({ deliveryZone: savedZone })
  } catch (saveError) {
    console.error('Admin delivery area save failed:', saveError.message)
    const message = saveError.code === '23505'
      ? 'That delivery area already exists.'
      : 'The delivery area could not be saved.'
    return res.status(409).json({ error: message })
  }
}

app.post('/api/admin/delivery-zones', requireAdmin, saveDeliveryZone)
app.patch('/api/admin/delivery-zones/:zoneId', requireAdmin, saveDeliveryZone)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Affordable Gold API listening on http://localhost:${PORT}`)
  const missing = missingEnv()
  if (missing.length) {
    console.log(`Still blank in server/.env: ${missing.join(', ')}`)
  } else {
    console.log('All server settings are filled in.')
  }
})
