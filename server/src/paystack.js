import crypto from 'node:crypto'

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
const paystackBaseUrl = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co'

export const hasPaystackConfig = Boolean(paystackSecretKey)

const paystackRequest = async (path, options = {}) => {
  const response = await fetch(`${paystackBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.status) {
    throw new Error(result?.message || 'Paystack did not accept the request.')
  }

  return result.data
}

export const initializePaystackPayment = async ({ email, amountKobo, reference, callbackUrl, metadata }) => {
  if (!hasPaystackConfig) {
    throw new Error('Paystack is not configured')
  }

  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      currency: 'NGN',
      metadata
    })
  })
}

export const verifyPaystackPayment = async (reference) => {
  if (!hasPaystackConfig) {
    throw new Error('Paystack is not configured')
  }

  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`)
}

export const isValidPaystackSignature = (rawBody, signature) => {
  if (!paystackSecretKey || !signature) {
    return false
  }

  const expected = crypto.createHmac('sha512', paystackSecretKey).update(rawBody).digest('hex')

  if (expected.length !== signature.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
