import 'dotenv/config'
import express from 'express'
import cors from 'cors'

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
