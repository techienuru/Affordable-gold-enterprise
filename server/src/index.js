import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import {
  getAdminCatalog,
  getAdminOrders,
  getOrderByPaystackReference,
  getOrderById,
  getOrderForEmail,
  getOrderForPayment,
  getUserFromAccessToken,
  hasServerSupabaseConfig,
  isAdminUser,
  markOrderPaid,
  markOrderPaymentFailed,
  saveAdminDeliveryZone,
  saveAdminProduct,
  saveOrder,
  savePaystackReference,
  updateAdminOrder
} from './supabase.js'
import { validateAdminOrderUpdate, validateOrderRequest } from './orders.js'
import { validateAdminDeliveryZone, validateAdminProduct } from './admin.js'
import { sendOrderEmails } from './email.js'
import {
  hasPaystackConfig,
  initializePaystackPayment,
  isValidPaystackSignature,
  verifyPaystackPayment
} from './paystack.js'

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_URL, credentials: true }))

const readMetadata = (value) => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

// Paystack posts the raw body, so this route must stay above express.json().
app.post('/api/payments/paystack/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  if (!hasPaystackConfig || !hasServerSupabaseConfig) {
    return res.status(503).json({ error: 'Card payments are not configured yet.' })
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('')

  if (!isValidPaystackSignature(rawBody, req.get('x-paystack-signature') || '')) {
    return res.status(401).json({ error: 'Invalid signature.' })
  }

  let event

  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Invalid payload.' })
  }

  if (event?.event !== 'charge.success') {
    return res.json({ received: true })
  }

  const reference = typeof event?.data?.reference === 'string' ? event.data.reference : ''
  const metadata = readMetadata(event?.data?.metadata)
  const metadataOrderId = typeof metadata?.order_id === 'string' ? metadata.order_id : ''

  try {
    const order = metadataOrderId
      ? await getOrderById(metadataOrderId)
      : reference
        ? await getOrderByPaystackReference(reference)
        : null

    if (order && order.payment_status !== 'paid') {
      const expectedKobo = Math.round(Number(order.total) * 100)

      if (Number(event.data.amount) === expectedKobo && event.data.currency === 'NGN') {
        await markOrderPaid(order.id, reference)
      } else {
        console.error('Paystack webhook amount mismatch for order:', order.order_number)
      }
    }
  } catch (error) {
    console.error('Paystack webhook could not be processed:', error.message)
    return res.status(500).json({ error: 'Webhook could not be processed.' })
  }

  return res.json({ received: true })
})

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

const signedInUser = async (req, res) => {
  const accessToken = getAccessToken(req)

  if (!accessToken) {
    res.status(401).json({ error: 'Sign in before paying.' })
    return null
  }

  const user = await getUserFromAccessToken(accessToken)

  if (!user?.email) {
    res.status(401).json({ error: 'Your sign-in has expired. Sign in again.' })
    return null
  }

  return user
}

const PAYSTACK_MINIMUM_KOBO = 5000
const MOBILE_PAYMENT_CALLBACK = 'affordablegold://payment/return'

app.post('/api/payments/paystack/initialize', async (req, res) => {
  if (!hasServerSupabaseConfig || !hasPaystackConfig) {
    return res.status(503).json({ error: 'Card payments are not configured yet.' })
  }

  const user = await signedInUser(req, res)

  if (!user) return

  const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : ''

  if (!orderId) {
    return res.status(400).json({ error: 'Choose the order you want to pay for.' })
  }

  let order

  try {
    order = await getOrderForPayment(orderId, user.id)
  } catch (error) {
    console.error('Payment order lookup failed:', error.message)
    return res.status(500).json({ error: 'The order could not be loaded.' })
  }

  if (!order) {
    return res.status(404).json({ error: 'That order could not be found.' })
  }

  if (order.payment_status === 'paid') {
    return res.status(409).json({ error: 'This order has already been paid.' })
  }

  if (!order.fee_confirmed) {
    return res.status(409).json({ error: 'We will confirm the delivery fee first, then send you a payment link.' })
  }

  const amountKobo = Math.round(Number(order.total) * 100)

  if (!Number.isFinite(amountKobo) || amountKobo < PAYSTACK_MINIMUM_KOBO) {
    return res.status(400).json({ error: 'This order total is not ready for card payment yet.' })
  }

  const reference = `${order.order_number}-${Date.now()}`
  const callbackUrl = req.body?.platform === 'mobile'
    ? MOBILE_PAYMENT_CALLBACK
    : `${CLIENT_URL}/checkout?payment=return`

  try {
    const transaction = await initializePaystackPayment({
      email: order.customer_email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: {
        order_id: order.id,
        order_number: order.order_number
      }
    })

    const savedReference = transaction.reference || reference

    await savePaystackReference(order.id, savedReference)

    return res.json({
      authorizationUrl: transaction.authorization_url,
      reference: savedReference,
      orderNumber: order.order_number,
      amount: order.total
    })
  } catch (error) {
    console.error('Paystack initialization failed:', error.message)
    return res.status(502).json({ error: 'We could not start the card payment. Please try again.' })
  }
})

app.get('/api/payments/paystack/verify', async (req, res) => {
  if (!hasServerSupabaseConfig || !hasPaystackConfig) {
    return res.status(503).json({ error: 'Card payments are not configured yet.' })
  }

  const user = await signedInUser(req, res)

  if (!user) return

  const reference = typeof req.query.reference === 'string' ? req.query.reference.trim() : ''

  if (!reference) {
    return res.status(400).json({ error: 'The payment reference is missing.' })
  }

  let order

  try {
    order = await getOrderByPaystackReference(reference)
  } catch (error) {
    console.error('Payment lookup failed:', error.message)
    return res.status(500).json({ error: 'The payment could not be checked.' })
  }

  if (!order || order.user_id !== user.id) {
    return res.status(404).json({ error: 'We could not find that payment.' })
  }

  if (order.payment_status === 'paid') {
    return res.json({ status: 'paid', orderNumber: order.order_number, total: order.total })
  }

  let transaction

  try {
    transaction = await verifyPaystackPayment(reference)
  } catch (error) {
    console.error('Paystack verification failed:', error.message)
    return res.status(502).json({ error: 'We could not confirm the payment. Please try again.' })
  }

  if (transaction?.status === 'success') {
    const expectedKobo = Math.round(Number(order.total) * 100)

    if (Number(transaction.amount) !== expectedKobo || transaction.currency !== 'NGN') {
      console.error('Paystack amount mismatch for order:', order.order_number)
      return res.json({
        status: 'mismatch',
        orderNumber: order.order_number,
        message: 'We received a payment that does not match this order. We will call you.'
      })
    }

    try {
      const result = await markOrderPaid(order.id, reference)

      return res.json({
        status: 'paid',
        orderNumber: order.order_number,
        total: result.order?.total ?? order.total
      })
    } catch (error) {
      console.error('Paid order could not be updated:', error.message)
      return res.status(500).json({
        error: 'The payment went through, but we could not update your order. We will sort it out.'
      })
    }
  }

  if (transaction?.status === 'failed') {
    try {
      await markOrderPaymentFailed(order.id)
    } catch (error) {
      console.error('Failed payment could not be recorded:', error.message)
    }

    return res.json({ status: 'failed', orderNumber: order.order_number })
  }

  return res.json({ status: 'pending', orderNumber: order.order_number })
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
