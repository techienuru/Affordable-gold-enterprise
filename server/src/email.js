import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import nodemailer from 'nodemailer'

const mailgunKey = process.env.MAILGUN_API_KEY
const mailgunDomain = process.env.MAILGUN_DOMAIN
const mailgunRegion = process.env.MAILGUN_API_REGION || 'us'
const fromEmail = process.env.MAILGUN_FROM_EMAIL
const fromName = process.env.MAILGUN_FROM_NAME || 'Affordable Gold Enterprise'
const orderAlertEmail = process.env.ORDER_ALERT_EMAIL

export const hasMailgunConfig = Boolean(
  mailgunKey && mailgunDomain && fromEmail && orderAlertEmail
)

const clientOptions = {
  username: 'api',
  key: mailgunKey || ''
}

if (mailgunRegion.toLowerCase() === 'eu') {
  clientOptions.url = 'https://api.eu.mailgun.net'
}

const mailgunClient = hasMailgunConfig
  ? new Mailgun(FormData).client(clientOptions)
  : null

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFromEmail = process.env.SMTP_FROM_EMAIL || smtpUser
const smtpFromName = process.env.SMTP_FROM_NAME || fromName

export const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass && smtpFromEmail)

const smtpTransport = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null

const formatMoney = (value) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2
}).format(Number(value) || 0)

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const paymentLabels = {
  card: 'Card',
  transfer: 'Bank transfer',
  pay_on_delivery: 'Pay on delivery'
}

const fulfilmentText = (order) => {
  if (order.fulfilment === 'pickup') {
    return 'Pickup — we will call to arrange the collection point and time.'
  }

  const feeNote = order.fee_confirmed
    ? `${order.delivery_zone_name}: ${formatMoney(order.delivery_fee)}`
    : `${order.delivery_zone_name}: fee will be confirmed by phone`

  return `Delivery to ${order.delivery_address}. ${feeNote}.`
}

const paymentText = (order) => order.payment_method === 'transfer'
  ? 'Bank transfer — we will contact you with the payment details.'
  : 'Pay on delivery — we will call to confirm your order.'

const itemText = (item) => (
  `${item.quantity} × ${item.product_name}${item.unit ? ` (${item.unit})` : ''} — ${formatMoney(item.line_total)}`
)

const itemRows = (items) => items.map((item) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #e8e0d0;color:#1c1a17">
      ${escapeHtml(item.quantity)} × ${escapeHtml(item.product_name)}
      ${item.unit ? `<div style="color:#625c53;font-size:13px">${escapeHtml(item.unit)}</div>` : ''}
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #e8e0d0;color:#1c1a17;text-align:right;white-space:nowrap">
      ${escapeHtml(formatMoney(item.line_total))}
    </td>
  </tr>
`).join('')

const emailFrame = (heading, introduction, order, extraContent = '') => `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#fffdf8;font-family:Arial,sans-serif;color:#1c1a17">
    <div style="max-width:620px;margin:0 auto;padding:32px 20px">
      <div style="padding:22px;border-radius:16px 16px 0 0;background:#c89b3c">
        <div style="font-size:13px;font-weight:700;color:#17462f">AFFORDABLE GOLD ENTERPRISE</div>
        <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2">${escapeHtml(heading)}</h1>
      </div>
      <div style="padding:24px;border:1px solid #e8e0d0;border-top:0;border-radius:0 0 16px 16px;background:#ffffff">
        <p style="margin:0 0 20px;line-height:1.6">${escapeHtml(introduction)}</p>
        <p style="margin:0 0 16px;color:#17462f;font-weight:700">Order ${escapeHtml(order.order_number)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse">
          ${itemRows(order.order_items || [])}
        </table>
        <table role="presentation" style="width:100%;margin-top:18px;border-collapse:collapse">
          <tr><td style="padding:5px 0">Subtotal</td><td style="padding:5px 0;text-align:right">${escapeHtml(formatMoney(order.subtotal))}</td></tr>
          <tr><td style="padding:5px 0">Delivery</td><td style="padding:5px 0;text-align:right">${order.fee_confirmed ? escapeHtml(formatMoney(order.delivery_fee)) : 'To be confirmed'}</td></tr>
          <tr><td style="padding:12px 0 5px;border-top:1px solid #e8e0d0;font-size:18px;font-weight:700">${order.fee_confirmed ? 'Total' : 'Current total'}</td><td style="padding:12px 0 5px;border-top:1px solid #e8e0d0;text-align:right;font-size:18px;font-weight:700">${escapeHtml(formatMoney(order.total))}</td></tr>
        </table>
        ${extraContent}
        <p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #e8e0d0;color:#625c53;font-size:13px;line-height:1.5">
          Thank you for choosing Affordable Gold Enterprise.
        </p>
      </div>
    </div>
  </body>
</html>
`

const customerMessage = (order) => {
  const text = [
    `Hello ${order.customer_name},`,
    '',
    `We received your order ${order.order_number}.`,
    '',
    ...(order.order_items || []).map(itemText),
    '',
    `Subtotal: ${formatMoney(order.subtotal)}`,
    `Delivery: ${order.fee_confirmed ? formatMoney(order.delivery_fee) : 'To be confirmed'}`,
    `${order.fee_confirmed ? 'Total' : 'Current total'}: ${formatMoney(order.total)}`,
    '',
    fulfilmentText(order),
    paymentText(order),
    '',
    'Thank you for choosing Affordable Gold Enterprise.'
  ].join('\n')

  const extraContent = `
    <div style="margin-top:20px;padding:16px;border-radius:10px;background:#e4f0e8;color:#17462f;line-height:1.55">
      <strong>${escapeHtml(paymentLabels[order.payment_method] || order.payment_method)}</strong><br>
      ${escapeHtml(fulfilmentText(order))}<br>
      ${escapeHtml(paymentText(order))}
    </div>
  `

  return {
    from: `${fromName} <${fromEmail}>`,
    to: [order.customer_email],
    subject: `Order ${order.order_number} received`,
    text,
    html: emailFrame('Your order has been received', `Hello ${order.customer_name}, we have safely received your order.`, order, extraContent)
  }
}

const adminMessage = (order) => {
  const customerDetails = [
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    `Phone: ${order.customer_phone}`,
    `Fulfilment: ${fulfilmentText(order)}`,
    `Payment: ${paymentLabels[order.payment_method] || order.payment_method}`,
    order.delivery_note ? `Note: ${order.delivery_note}` : null
  ].filter(Boolean)

  const text = [
    `New order ${order.order_number}`,
    '',
    ...customerDetails,
    '',
    ...(order.order_items || []).map(itemText),
    '',
    `${order.fee_confirmed ? 'Total' : 'Current total'}: ${formatMoney(order.total)}`
  ].join('\n')

  const extraContent = `
    <div style="margin-top:20px;padding:16px;border-radius:10px;background:#f6e8bd;color:#1c1a17;line-height:1.55">
      ${customerDetails.map((detail) => `${escapeHtml(detail)}<br>`).join('')}
    </div>
  `

  return {
    to: [orderAlertEmail],
    subject: `New order ${order.order_number} — ${formatMoney(order.total)}`,
    text,
    html: emailFrame('A new order has arrived', `${order.customer_name} placed a new order.`, order, extraContent)
  }
}

const mailgunSender = (message) => mailgunClient.messages.create(mailgunDomain, {
  from: `${fromName} <${fromEmail}>`,
  to: message.to,
  subject: message.subject,
  text: message.text,
  html: message.html
})

const smtpSender = (message) => smtpTransport.sendMail({
  from: `${smtpFromName} <${smtpFromEmail}>`,
  to: message.to.join(', '),
  subject: message.subject,
  text: message.text,
  html: message.html
})

const sendMessage = async (message) => {
  const senders = []

  if (mailgunClient) senders.push(['Mailgun', mailgunSender])
  if (smtpTransport) senders.push(['SMTP', smtpSender])

  for (const [provider, send] of senders) {
    try {
      await send(message)
      return { sent: true, provider }
    } catch (error) {
      console.error(`${provider} could not send the email:`, error.message)
    }
  }

  return { sent: false, provider: null }
}

export const sendOrderEmails = async (order) => {
  if (!mailgunClient && !smtpTransport) {
    return { customerSent: false, adminSent: false }
  }

  const [customerResult, adminResult] = await Promise.allSettled([
    sendMessage(customerMessage(order)),
    sendMessage(adminMessage(order))
  ])

  return {
    customerSent: customerResult.status === 'fulfilled' && customerResult.value.sent,
    adminSent: adminResult.status === 'fulfilled' && adminResult.value.sent
  }
}
