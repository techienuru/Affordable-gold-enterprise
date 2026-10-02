import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

const CartContext = createContext(null)
const storageKey = 'affordable-gold-cart'

const readSavedCart = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey))

    if (!Array.isArray(saved)) {
      return []
    }

    return saved
      .filter((item) => (
        item
        && typeof item.id === 'string'
        && typeof item.name === 'string'
        && Number.isFinite(Number(item.price))
        && Number.isInteger(item.stock)
        && item.stock > 0
        && Number.isInteger(item.quantity)
        && item.quantity > 0
      ))
      .map((item) => ({
        ...item,
        quantity: Math.min(item.quantity, item.stock)
      }))
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readSavedCart)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items])

  const addItem = (product, quantity = 1) => {
    const amount = Math.max(1, Math.min(quantity, product.stock))

    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === product.id)

      if (existing) {
        return currentItems.map((item) => item.id === product.id
          ? {
              ...item,
              stock: product.stock,
              quantity: Math.min(item.quantity + amount, product.stock)
            }
          : item)
      }

      return [
        ...currentItems,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          category: product.category,
          unit: product.unit,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
          quantity: amount
        }
      ]
    })
  }

  const updateQuantity = (productId, quantity) => {
    setItems((currentItems) => currentItems.map((item) => item.id === productId
      ? {
          ...item,
          quantity: Math.max(1, Math.min(quantity, item.stock))
        }
      : item))
  }

  const removeItem = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setItems([])
  }

  const value = useMemo(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotalKobo = items.reduce(
      (total, item) => total + Math.round(Number(item.price) * 100) * item.quantity,
      0
    )

    return {
      items,
      itemCount,
      subtotalKobo,
      addItem,
      updateQuantity,
      removeItem,
      clearCart
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
