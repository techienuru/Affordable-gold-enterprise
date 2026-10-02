import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import {
  getOrderForEmail,
  getUserFromAccessToken,
  hasServerSupabaseConfig,
  saveOrder
} from './supabase.js'
import { validateOrderRequest } from './orders.js'
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

  const authorization = req.get('authorization') || ''
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''

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
