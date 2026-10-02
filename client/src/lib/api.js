const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export const createOrder = async (accessToken, order) => {
  const response = await fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || 'Your order could not be saved. Please try again.')
  }

  return {
    ...result.order,
    notifications: result.notifications
  }
}
