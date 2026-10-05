import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CartItem, Product } from '@/types'
import { persistentStorage } from '@/lib/storage'

const storageKey = 'affordable-gold-mobile-cart'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotalKobo: number
  ready: boolean
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const cleanCart = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) return []

  return value.filter((item) => (
    item
    && typeof item.id === 'string'
    && typeof item.name === 'string'
    && Number.isFinite(Number(item.price))
    && Number.isInteger(item.stock)
    && item.stock > 0
    && Number.isInteger(item.quantity)
    && item.quantity > 0
  )).map((item) => ({
    ...item,
    quantity: Math.min(item.quantity, item.stock)
  })) as CartItem[]
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    persistentStorage.getItem(storageKey)
      .then((saved) => setItems(cleanCart(saved ? JSON.parse(saved) : [])))
      .catch(() => setItems([]))
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    persistentStorage.setItem(storageKey, JSON.stringify(items)).catch(() => undefined)
  }, [items, ready])

  const addItem = (product: Product, quantity = 1) => {
    const amount = Math.max(1, Math.min(quantity, product.stock))

    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)

      if (existing) {
        return current.map((item) => item.id === product.id
          ? { ...item, stock: product.stock, quantity: Math.min(item.quantity + amount, product.stock) }
          : item)
      }

      return [...current, { ...product, quantity: amount }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((current) => current.map((item) => item.id === productId
      ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
      : item))
  }

  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId))
  }

  const clearCart = () => setItems([])

  const value = useMemo<CartContextValue>(() => ({
    items,
    ready,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotalKobo: items.reduce(
      (total, item) => total + Math.round(Number(item.price) * 100) * item.quantity,
      0
    ),
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  }), [items, ready])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
