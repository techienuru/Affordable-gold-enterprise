import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Route,
  Routes,
  useLocation,
  useParams
} from 'react-router-dom'
import {
  getDeliveryZones,
  getProduct,
  getProducts,
  hasSupabaseConfig
} from './lib/supabase.js'
import { CartProvider, useCart } from './context/CartContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { createOrder } from './lib/api.js'

const formatPrice = (value) => {
  const amount = Number(value)
  const hasKobo = Number.isFinite(amount) && amount % 1 !== 0

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: hasKobo ? 2 : 0
  }).format(amount || 0)
}

const formatKobo = (value) => formatPrice(value / 100)

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5m6 6-6-6 6-6" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M26 5C15 5 7 10 7 19c0 4 3 7 7 7 9 0 12-10 12-21Z" />
      <path d="M5 28c3-7 8-12 16-16" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="m8 15 16-8 16 8-16 8-16-8Z" />
      <path d="M8 15v18l16 8 16-8V15M24 23v18M16 11l16 8" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 7H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h11v11H3V6Zm11 4h4l3 3v4h-7v-7ZM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v10h16V10M3 4h18l-1 6a3 3 0 0 1-5 1 3 3 0 0 1-6 0 3 3 0 0 1-5-1L3 4Zm6 16v-5h6v5" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" />
      <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10.1 10.1 0 0 0 12 22Z" />
      <path fill="#fbbc05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10.1 10.1 0 0 0 0 9.3L6.5 14Z" />
      <path fill="#ea4335" d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10.1 10.1 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z" />
    </svg>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function SiteHeader() {
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()
  const customerName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email
  const firstName = customerName?.split(' ')[0]

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" to="/" aria-label="Affordable Gold Enterprise home">
          <span className="brand__mark"><LeafIcon /></span>
          <span className="brand__words">
            <strong>Affordable Gold</strong>
            <small>Enterprise</small>
          </span>
        </Link>
        <div className="header-actions">
          <span className="delivery-note">Keffi · Lafia · Abuja · Nationwide</span>
          {user && (
            <div className="account-chip">
              <span>Hi, {firstName}</span>
              <button type="button" onClick={signOut} aria-label={`Sign out ${customerName}`}>
                Sign out
              </button>
            </div>
          )}
          <Link
            className="cart-link"
            to="/cart"
            aria-label={`Cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <CartIcon />
            <span>Cart</span>
            {itemCount > 0 && <strong aria-hidden="true">{itemCount}</strong>}
          </Link>
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div>
          <strong>Affordable Gold Enterprise</strong>
          <p>Pure honey and quality food items, delivered with care.</p>
        </div>
        <p>Keffi · Lafia · Abuja · Nationwide delivery</p>
      </div>
    </footer>
  )
}

function ProductArtwork({ product, eager = false }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = product.image_url && !imageFailed
  const category = (product.category || 'Food').toLowerCase()

  return (
    <div className="product-artwork" data-category={category}>
      {hasImage ? (
        <img
          src={product.image_url}
          alt={`${product.name}${product.unit ? `, ${product.unit}` : ''}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="product-artwork__placeholder"
          role="img"
          aria-label={`${product.name} product illustration`}
        >
          <span className="product-artwork__sun" />
          <PackageIcon />
          <span>{product.category || 'Food item'}</span>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }) {
  const path = `/products/${product.slug || product.id}`
  const available = product.stock > 0

  return (
    <article className="product-card">
      <Link className="product-card__image-link" to={path} tabIndex="-1" aria-hidden="true">
        <ProductArtwork product={product} />
      </Link>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.category || 'Food item'}</span>
          <span className={available ? 'stock stock--available' : 'stock stock--empty'}>
            {available ? 'Available' : 'Out of stock'}
          </span>
        </div>
        <h3><Link to={path}>{product.name}</Link></h3>
        <p className="product-card__unit">{product.unit || 'Per item'}</p>
        <div className="product-card__bottom">
          <strong className="price">{formatPrice(product.price)}</strong>
          <Link className="text-link" to={path}>
            View product <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="product-grid" aria-label="Loading products" aria-busy="true">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div className="product-card product-card--loading" key={item}>
          <span className="skeleton skeleton--image" />
          <div className="product-card__body">
            <span className="skeleton skeleton--short" />
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--price" />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusPanel({ title, message, action }) {
  return (
    <div className="status-panel" role="status">
      <PackageIcon />
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  )
}

function ShopPage() {
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [state, setState] = useState(hasSupabaseConfig ? 'loading' : 'setup')

  const loadProducts = async () => {
    if (!hasSupabaseConfig) {
      setState('setup')
      return
    }

    setState('loading')

    try {
      const data = await getProducts()
      setProducts(data)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    document.title = 'Shop | Affordable Gold Enterprise'
    loadProducts()
  }, [])

  const categories = useMemo(() => [
    'All',
    ...new Set(products.map((product) => product.category).filter(Boolean))
  ], [products])

  const visibleProducts = selectedCategory === 'All'
    ? products
    : products.filter((product) => product.category === selectedCategory)

  return (
    <>
      <section className="shop-hero">
        <div className="shell shop-hero__inner">
          <div className="shop-hero__copy">
            <p className="eyebrow">From our shelves to your table</p>
            <h1>Good food, honestly sourced.</h1>
            <p>Shop pure honey and everyday food items from a trusted local business, with delivery across Nigeria.</p>
            <a className="button button--green" href="#products">See what’s available</a>
          </div>
          <div className="market-stamp" aria-hidden="true">
            <span className="market-stamp__ring" />
            <span className="market-stamp__leaf"><LeafIcon /></span>
            <strong>Pure</strong>
            <small>Local goodness</small>
          </div>
        </div>
      </section>

      <main id="products" className="shop-main shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The shop</p>
            <h2>Choose something good</h2>
          </div>
          {state === 'ready' && products.length > 0 && (
            <p>{products.length} {products.length === 1 ? 'product' : 'products'} available</p>
          )}
        </div>

        {state === 'ready' && products.length > 0 && (
          <div className="category-filters" aria-label="Filter products by category">
            {categories.map((category) => (
              <button
                className="filter-button"
                type="button"
                key={category}
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'All' ? 'All products' : category}
              </button>
            ))}
          </div>
        )}

        {state === 'loading' && <ProductGridSkeleton />}

        {state === 'setup' && (
          <StatusPanel
            title="The shop needs its database connection"
            message="Add the Supabase project URL and public key to client/.env, then restart the front-end."
          />
        )}

        {state === 'error' && (
          <StatusPanel
            title="Products could not be loaded"
            message="Check your connection and try again."
            action={<button className="button button--gold" type="button" onClick={loadProducts}>Try again</button>}
          />
        )}

        {state === 'ready' && products.length === 0 && (
          <StatusPanel
            title="The shelves are being prepared"
            message="There are no active products to show yet."
          />
        )}

        {state === 'ready' && visibleProducts.length > 0 && (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}
      </main>

      <section className="service-strip">
        <div className="shell service-strip__inner">
          <div>
            <span className="service-strip__icon"><LeafIcon /></span>
            <div><strong>Carefully selected</strong><span>Quality food items from a local seller</span></div>
          </div>
          <div>
            <span className="service-strip__icon"><PackageIcon /></span>
            <div><strong>Flexible fulfilment</strong><span>Delivery or free pickup</span></div>
          </div>
        </div>
      </section>
    </>
  )
}

function ProductDetailPage() {
  const { slug } = useParams()
  const { addItem, items } = useCart()
  const [product, setProduct] = useState(null)
  const [state, setState] = useState(hasSupabaseConfig ? 'loading' : 'setup')
  const [quantity, setQuantity] = useState(1)
  const [addedMessage, setAddedMessage] = useState('')

  const loadProduct = async () => {
    if (!hasSupabaseConfig) {
      setState('setup')
      return
    }

    setState('loading')

    try {
      const data = await getProduct(slug)
      setProduct(data)
      setQuantity(1)
      setAddedMessage('')
      setState(data ? 'ready' : 'missing')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    loadProduct()
  }, [slug])

  useEffect(() => {
    document.title = product
      ? `${product.name} | Affordable Gold Enterprise`
      : 'Product | Affordable Gold Enterprise'
  }, [product])

  if (state === 'loading') {
    return (
      <main className="shell detail-loading" aria-label="Loading product" aria-busy="true">
        <span className="skeleton skeleton--detail-image" />
        <div>
          <span className="skeleton skeleton--short" />
          <span className="skeleton skeleton--detail-title" />
          <span className="skeleton skeleton--title" />
        </div>
      </main>
    )
  }

  if (state !== 'ready') {
    const messages = {
      setup: ['The shop needs its database connection', 'Add the Supabase settings to client/.env, then restart the front-end.'],
      missing: ['This product is not available', 'It may have been removed or the link may be incorrect.'],
      error: ['This product could not be loaded', 'Check your connection and try again.']
    }
    const [title, message] = messages[state]

    return (
      <main className="shell detail-status">
        <StatusPanel
          title={title}
          message={message}
          action={state === 'error'
            ? <button className="button button--gold" type="button" onClick={loadProduct}>Try again</button>
            : <Link className="button button--gold" to="/">Back to the shop</Link>}
        />
      </main>
    )
  }

  const available = product.stock > 0
  const cartQuantity = items.find((item) => item.id === product.id)?.quantity || 0
  const remainingQuantity = Math.max(product.stock - cartQuantity, 0)

  const addToCart = () => {
    const amount = Math.min(quantity, remainingQuantity)

    if (amount === 0) {
      setAddedMessage('You already have the available quantity in your cart.')
      return
    }

    addItem(product, amount)
    setAddedMessage(`${amount} ${amount === 1 ? 'item' : 'items'} added to your cart.`)
    setQuantity(1)
  }

  return (
    <main className="shell product-detail">
      <Link className="back-link" to="/"><BackIcon /> Back to all products</Link>
      <div className="product-detail__grid">
        <ProductArtwork product={product} eager />
        <section className="product-detail__content">
          <p className="eyebrow">{product.category || 'Food item'}</p>
          <h1>{product.name}</h1>
          <p className="product-detail__unit">{product.unit || 'Per item'}</p>
          <strong className="price price--large">{formatPrice(product.price)}</strong>
          <p className="product-detail__description">
            {product.description || 'A quality food item selected by Affordable Gold Enterprise.'}
          </p>
          <div className={`availability ${available ? 'availability--yes' : 'availability--no'}`}>
            <span aria-hidden="true" />
            <div>
              <strong>{available ? 'Available to order' : 'Currently out of stock'}</strong>
              <p>{available ? `${product.stock} currently available` : 'Check back again soon'}</p>
            </div>
          </div>
          {available && remainingQuantity > 0 && (
            <div className="purchase-controls">
              <div className="quantity-field">
                <span id="product-quantity-label">Quantity</span>
                <div className="quantity-stepper" role="group" aria-labelledby="product-quantity-label">
                  <button
                    type="button"
                    aria-label="Reduce quantity"
                    disabled={quantity === 1}
                    onClick={() => setQuantity((current) => current - 1)}
                  >
                    <MinusIcon />
                  </button>
                  <output aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= remainingQuantity}
                    onClick={() => setQuantity((current) => current + 1)}
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
              <button className="button button--gold purchase-controls__add" type="button" onClick={addToCart}>
                Add to cart
              </button>
            </div>
          )}
          {!available && (
            <button className="button button--gold button--wide" type="button" disabled>
              Out of stock
            </button>
          )}
          {available && remainingQuantity === 0 && (
            <Link className="button button--green button--wide" to="/cart">
              View your cart
            </Link>
          )}
          <p className="cart-feedback" role="status" aria-live="polite">{addedMessage}</p>
        </section>
      </div>
    </main>
  )
}

function CartPage() {
  const {
    items,
    itemCount,
    subtotalKobo,
    updateQuantity,
    removeItem
  } = useCart()

  useEffect(() => {
    document.title = 'Your cart | Affordable Gold Enterprise'
  }, [])

  if (items.length === 0) {
    return (
      <main className="shell cart-page cart-page--empty">
        <StatusPanel
          title="Your cart is empty"
          message="Choose a product and add it here when you are ready."
          action={<Link className="button button--gold" to="/">Browse the shop</Link>}
        />
      </main>
    )
  }

  return (
    <main className="shell cart-page">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Your selection</p>
          <h1>Your cart</h1>
        </div>
        <p>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="cart-layout">
        <section className="cart-items" aria-label="Products in your cart">
          {items.map((item) => {
            const path = `/products/${item.slug || item.id}`
            const lineTotalKobo = Math.round(Number(item.price) * 100) * item.quantity

            return (
              <article className="cart-item" key={item.id}>
                <Link className="cart-item__image" to={path} tabIndex="-1" aria-hidden="true">
                  <ProductArtwork product={item} />
                </Link>
                <div className="cart-item__details">
                  <p>{item.category || 'Food item'}</p>
                  <h2><Link to={path}>{item.name}</Link></h2>
                  <span>{item.unit || 'Per item'}</span>
                  <button className="remove-button" type="button" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
                <div className="cart-item__quantity">
                  <span id={`quantity-${item.id}`}>Quantity</span>
                  <div className="quantity-stepper" role="group" aria-labelledby={`quantity-${item.id}`}>
                    <button
                      type="button"
                      aria-label={`Reduce ${item.name} quantity`}
                      disabled={item.quantity === 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <MinusIcon />
                    </button>
                    <output aria-live="polite">{item.quantity}</output>
                    <button
                      type="button"
                      aria-label={`Increase ${item.name} quantity`}
                      disabled={item.quantity >= item.stock}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
                <strong className="cart-item__total">{formatKobo(lineTotalKobo)}</strong>
              </article>
            )
          })}
          <Link className="back-link" to="/"><BackIcon /> Continue shopping</Link>
        </section>

        <aside className="cart-summary" aria-labelledby="cart-summary-title">
          <p className="eyebrow">Order summary</p>
          <h2 id="cart-summary-title">Before delivery</h2>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <strong>{formatKobo(subtotalKobo)}</strong>
          </div>
          <p className="cart-summary__note">Delivery or pickup will be chosen during checkout. Delivery fees are not included yet.</p>
          <Link className="button button--gold button--wide" to="/checkout">
            Go to checkout
          </Link>
        </aside>
      </div>
    </main>
  )
}

function CheckoutPage() {
  const { items, itemCount, subtotalKobo, clearCart } = useCart()
  const {
    user,
    accessToken,
    loading: authLoading,
    error: authError,
    signInWithGoogle
  } = useAuth()
  const [fulfilment, setFulfilment] = useState('delivery')
  const [zones, setZones] = useState([])
  const [zoneState, setZoneState] = useState(hasSupabaseConfig ? 'loading' : 'setup')
  const [zoneId, setZoneId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [orderState, setOrderState] = useState('idle')
  const [orderError, setOrderError] = useState('')
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  useEffect(() => {
    document.title = 'Checkout | Affordable Gold Enterprise'

    if (!hasSupabaseConfig) {
      return
    }

    getDeliveryZones()
      .then((data) => {
        setZones(data)
        setZoneId(data[0]?.id || '')
        setZoneState('ready')
      })
      .catch(() => setZoneState('error'))
  }, [])

  if (orderConfirmation) {
    const feeMessage = orderConfirmation.fee_confirmed
      ? `The total is ${formatPrice(orderConfirmation.total)}.`
      : `The current total is ${formatPrice(orderConfirmation.total)}. We will call to confirm the delivery fee.`
    const emailMessage = orderConfirmation.notifications?.customerSent
      ? 'A confirmation email is on its way.'
      : 'The order is saved, but the confirmation email could not be sent.'

    return (
      <main className="shell detail-status order-confirmation">
        <StatusPanel
          title="Your order has been received"
          message={`Order ${orderConfirmation.order_number} has been saved. ${feeMessage} ${emailMessage}`}
          action={<Link className="button button--gold" to="/">Continue shopping</Link>}
        />
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="shell cart-page cart-page--empty">
        <StatusPanel
          title="Your cart is empty"
          message="Add something to your cart before starting checkout."
          action={<Link className="button button--gold" to="/">Browse the shop</Link>}
        />
      </main>
    )
  }

  const selectedZone = zones.find((zone) => zone.id === zoneId)
  const needsQuote = fulfilment === 'delivery' && selectedZone?.needs_quote
  const deliveryFeeKobo = fulfilment === 'delivery' && selectedZone && !needsQuote
    ? Math.round(Number(selectedZone.fee) * 100)
    : 0
  const totalKobo = subtotalKobo + deliveryFeeKobo
  const customerName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  const savingOrder = orderState === 'saving'
  const deliveryUnavailable = fulfilment === 'delivery' && zoneState !== 'ready'

  const handleOrderSubmit = async (event) => {
    event.preventDefault()

    if (!user || !accessToken) {
      setOrderError('Sign in with Google before placing your order.')
      return
    }

    const form = new FormData(event.currentTarget)
    setOrderState('saving')
    setOrderError('')

    try {
      const savedOrder = await createOrder(accessToken, {
        customerName: form.get('customerName'),
        customerPhone: form.get('customerPhone'),
        fulfilment,
        deliveryZoneId: fulfilment === 'delivery' ? zoneId : null,
        deliveryAddress: fulfilment === 'delivery' ? form.get('deliveryAddress') : null,
        deliveryNote: form.get('deliveryNote'),
        paymentMethod,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        }))
      })

      setOrderConfirmation(savedOrder)
      setOrderState('complete')
      clearCart()
      document.title = 'Order received | Affordable Gold Enterprise'
    } catch (error) {
      setOrderError(error.message)
      setOrderState('error')
    }
  }

  return (
    <main className="shell checkout-page">
      <Link className="back-link" to="/cart"><BackIcon /> Back to your cart</Link>
      <div className="checkout-heading">
        <p className="eyebrow">Almost there</p>
        <h1>Checkout</h1>
        <p>Tell us how to reach you and how you want your order.</p>
      </div>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          id="checkout-form"
          key={user?.id || 'guest'}
          aria-busy={savingOrder}
          onSubmit={handleOrderSubmit}
        >
          <section className="checkout-section" aria-labelledby="contact-heading">
            <div className="checkout-section__heading">
              <span>1</span>
              <div>
                <h2 id="contact-heading">Your details</h2>
                <p>We will use these details for this order.</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field form-field--full">
                <label htmlFor="customer-name">Full name</label>
                <input id="customer-name" name="customerName" autoComplete="name" defaultValue={customerName} required />
              </div>
              <div className="form-field">
                <label htmlFor="customer-email">Email address</label>
                <input
                  id="customer-email"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  defaultValue={user?.email || ''}
                  readOnly={Boolean(user)}
                  required
                />
                <small>{user ? 'This comes from your Google account.' : 'Your confirmation will be sent here.'}</small>
              </div>
              <div className="form-field">
                <label htmlFor="customer-phone">Phone number</label>
                <input id="customer-phone" name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0801 234 5678" required />
              </div>
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="fulfilment-heading">
            <div className="checkout-section__heading">
              <span>2</span>
              <div>
                <h2 id="fulfilment-heading">Delivery or pickup</h2>
                <p>Choose the option that works for you.</p>
              </div>
            </div>
            <div className="choice-grid">
              <label className={`choice-card ${fulfilment === 'delivery' ? 'choice-card--selected' : ''}`}>
                <input
                  type="radio"
                  name="fulfilment"
                  value="delivery"
                  checked={fulfilment === 'delivery'}
                  onChange={() => setFulfilment('delivery')}
                />
                <span className="choice-card__icon"><TruckIcon /></span>
                <span><strong>Delivery</strong><small>We bring it to your address</small></span>
              </label>
              <label className={`choice-card ${fulfilment === 'pickup' ? 'choice-card--selected' : ''}`}>
                <input
                  type="radio"
                  name="fulfilment"
                  value="pickup"
                  checked={fulfilment === 'pickup'}
                  onChange={() => setFulfilment('pickup')}
                />
                <span className="choice-card__icon"><StoreIcon /></span>
                <span><strong>Free pickup</strong><small>We will arrange a collection point</small></span>
              </label>
            </div>

            {fulfilment === 'delivery' && (
              <div className="delivery-fields">
                <div className="form-field">
                  <label htmlFor="delivery-zone">Delivery area</label>
                  <select
                    id="delivery-zone"
                    name="deliveryZone"
                    value={zoneId}
                    onChange={(event) => setZoneId(event.target.value)}
                    disabled={zoneState !== 'ready'}
                    required
                  >
                    {zoneState === 'loading' && <option value="">Loading areas...</option>}
                    {zoneState === 'setup' && <option value="">Database connection needed</option>}
                    {zoneState === 'error' && <option value="">Areas could not be loaded</option>}
                    {zones.map((zone) => (
                      <option value={zone.id} key={zone.id}>
                        {zone.name}{zone.needs_quote ? ' — fee confirmed by phone' : ` — ${formatPrice(zone.fee)}`}
                      </option>
                    ))}
                  </select>
                  {selectedZone?.details && <small>{selectedZone.details}</small>}
                </div>
                <div className="form-field">
                  <label htmlFor="delivery-address">Delivery address</label>
                  <textarea id="delivery-address" name="deliveryAddress" rows="3" autoComplete="street-address" required />
                </div>
                <div className="form-field">
                  <label htmlFor="delivery-note">Delivery note <span>(optional)</span></label>
                  <input id="delivery-note" name="deliveryNote" placeholder="For example: call when you arrive" />
                </div>
              </div>
            )}

            {fulfilment === 'pickup' && (
              <div className="checkout-notice">
                <strong>Pickup is free.</strong>
                <span>We will call you to agree on the collection point and time.</span>
              </div>
            )}
          </section>

          <section className="checkout-section" aria-labelledby="payment-heading">
            <div className="checkout-section__heading">
              <span>3</span>
              <div>
                <h2 id="payment-heading">Payment</h2>
                <p>Choose how you would like to pay.</p>
              </div>
            </div>
            <div className="payment-choices">
              {[
                ['card', 'Card', 'Coming after Paystack setup', true],
                ['transfer', 'Bank transfer', 'We confirm your payment before dispatch', false],
                ['pay_on_delivery', 'Pay on delivery', 'Available after we confirm your order', false]
              ].map(([value, label, note, disabled]) => (
                <label className={`payment-choice ${disabled ? 'payment-choice--disabled' : ''}`} key={value}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={paymentMethod === value}
                    disabled={disabled}
                    onChange={() => setPaymentMethod(value)}
                  />
                  <span><strong>{label}</strong><small>{note}</small></span>
                </label>
              ))}
            </div>
          </section>
        </form>

        <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
          <p className="eyebrow">Your order</p>
          <h2 id="checkout-summary-title">{itemCount} {itemCount === 1 ? 'item' : 'items'}</h2>
          <ul className="checkout-summary__items">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.quantity} × {item.name}<small>{item.unit}</small></span>
                <strong>{formatKobo(Math.round(Number(item.price) * 100) * item.quantity)}</strong>
              </li>
            ))}
          </ul>
          <div className="checkout-totals">
            <div><span>Subtotal</span><strong>{formatKobo(subtotalKobo)}</strong></div>
            <div>
              <span>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              <strong>{needsQuote ? 'To be confirmed' : formatKobo(deliveryFeeKobo)}</strong>
            </div>
            <div className="checkout-totals__total">
              <span>{needsQuote ? 'Current total' : 'Total'}</span>
              <strong>{formatKobo(totalKobo)}</strong>
            </div>
          </div>
          {needsQuote && (
            <p className="checkout-summary__quote">We will call you to confirm the delivery fee before processing the order.</p>
          )}
          {!user && (
            <button
              className="button button--google button--wide"
              type="button"
              disabled={authLoading}
              onClick={signInWithGoogle}
            >
              {!authLoading && <GoogleIcon />}
              {authLoading ? 'Checking sign-in...' : 'Sign in with Google to continue'}
            </button>
          )}
          {user && (
            <div className="signed-in-status" role="status">
              <strong>Signed in as {customerName || 'customer'}</strong>
              <span>{user.email}</span>
            </div>
          )}
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          {orderError && <p className="order-error" role="alert">{orderError}</p>}
          {user && (
            <button
              className="button button--gold button--wide place-order-button"
              type="submit"
              form="checkout-form"
              disabled={savingOrder || deliveryUnavailable || !accessToken}
            >
              {savingOrder ? 'Saving your order...' : 'Place order'}
            </button>
          )}
          <p className="checkout-summary__secure">
            {user ? 'Prices and delivery fees are checked again before saving.' : 'Your order has not been placed yet.'}
          </p>
        </aside>
      </div>
    </main>
  )
}

function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found | Affordable Gold Enterprise'
  }, [])

  return (
    <main className="shell detail-status">
      <StatusPanel
        title="This page could not be found"
        message="The address may be incorrect."
        action={<Link className="button button--gold" to="/">Go to the shop</Link>}
      />
    </main>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="app">
          <ScrollToTop />
          <a className="skip-link" href="#main-content">Skip to main content</a>
          <SiteHeader />
          <div className="route-content" id="main-content" tabIndex="-1">
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <SiteFooter />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
