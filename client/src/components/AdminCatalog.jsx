import { useEffect, useState } from 'react'
import { getAdminCatalog, saveAdminDeliveryZone, saveAdminProduct } from '../lib/api'
import { uploadProductImage } from '../lib/supabase'

const formatPrice = (amount) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2
}).format(Number(amount))

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const emptyProduct = {
  name: '',
  slug: '',
  category: '',
  description: '',
  price: '',
  unit: '',
  image_url: '',
  stock: 0,
  is_active: true
}

const emptyZone = {
  name: '',
  fee: '',
  details: '',
  needs_quote: false,
  is_active: true,
  sort_order: 0
}

function ProductEditor({ product = emptyProduct, accessToken, onSaved, onCancel }) {
  const [form, setForm] = useState(product)
  const [photo, setPhoto] = useState(null)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const isNew = !product.id

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateName = (value) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: isNew ? slugify(value) : current.slug
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setState('saving')
    setMessage('')

    try {
      const imageUrl = photo ? await uploadProductImage(photo) : form.image_url
      const saved = await saveAdminProduct(accessToken, product.id, {
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description,
        price: form.price,
        unit: form.unit,
        imageUrl,
        stock: form.stock,
        isActive: form.is_active
      })
      setForm(saved)
      setPhoto(null)
      setState('saved')
      setMessage(isNew ? 'Product added.' : 'Product changes saved.')
      onSaved(saved)
    } catch (error) {
      setState('error')
      setMessage(error.message)
    }
  }

  return (
    <form className="admin-editor" onSubmit={submit}>
      <div className="admin-editor__grid">
        <div className="form-field admin-editor__wide">
          <label htmlFor={`product-name-${product.id || 'new'}`}>Product name</label>
          <input id={`product-name-${product.id || 'new'}`} value={form.name} onChange={(event) => updateName(event.target.value)} required />
        </div>
        <div className="form-field admin-editor__wide">
          <label htmlFor={`product-slug-${product.id || 'new'}`}>Product link</label>
          <input id={`product-slug-${product.id || 'new'}`} value={form.slug} onChange={(event) => updateField('slug', slugify(event.target.value))} required />
          <small>Lowercase letters, numbers and hyphens only.</small>
        </div>
        <div className="form-field">
          <label htmlFor={`product-category-${product.id || 'new'}`}>Category</label>
          <input id={`product-category-${product.id || 'new'}`} value={form.category || ''} onChange={(event) => updateField('category', event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor={`product-unit-${product.id || 'new'}`}>Unit</label>
          <input id={`product-unit-${product.id || 'new'}`} value={form.unit || ''} onChange={(event) => updateField('unit', event.target.value)} placeholder="For example: 1 litre" />
        </div>
        <div className="form-field">
          <label htmlFor={`product-price-${product.id || 'new'}`}>Price in naira</label>
          <input id={`product-price-${product.id || 'new'}`} type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor={`product-stock-${product.id || 'new'}`}>Stock quantity</label>
          <input id={`product-stock-${product.id || 'new'}`} type="number" min="0" step="1" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} required />
        </div>
        <div className="form-field admin-editor__wide">
          <label htmlFor={`product-description-${product.id || 'new'}`}>Description</label>
          <textarea id={`product-description-${product.id || 'new'}`} rows="3" maxLength="2000" value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} />
        </div>
        <div className="form-field admin-editor__wide">
          <label htmlFor={`product-photo-${product.id || 'new'}`}>Product photo</label>
          <input id={`product-photo-${product.id || 'new'}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
          <small>JPG, PNG, WebP or AVIF. Maximum size: 2 MB.</small>
        </div>
      </div>

      <label className="admin-check">
        <input type="checkbox" checked={form.is_active} onChange={(event) => updateField('is_active', event.target.checked)} />
        <span>Show this product in the shop</span>
      </label>

      <div className="admin-editor__actions">
        <p className={state === 'error' ? 'admin-save-message admin-save-message--error' : 'admin-save-message'} role="status">{message}</p>
        {onCancel && <button className="button button--outline" type="button" onClick={onCancel}>Cancel</button>}
        <button className="button button--gold" type="submit" disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving...' : isNew ? 'Add product' : 'Save product'}
        </button>
      </div>
    </form>
  )
}

function DeliveryZoneEditor({ zone = emptyZone, accessToken, onSaved, onCancel }) {
  const [form, setForm] = useState(zone)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const isNew = !zone.id

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setState('saving')
    setMessage('')

    try {
      const saved = await saveAdminDeliveryZone(accessToken, zone.id, {
        name: form.name,
        fee: form.fee,
        details: form.details,
        needsQuote: form.needs_quote,
        isActive: form.is_active,
        sortOrder: form.sort_order
      })
      setForm(saved)
      setState('saved')
      setMessage(isNew ? 'Delivery area added.' : 'Delivery changes saved.')
      onSaved(saved)
    } catch (error) {
      setState('error')
      setMessage(error.message)
    }
  }

  return (
    <form className="admin-editor" onSubmit={submit}>
      <div className="admin-editor__grid">
        <div className="form-field admin-editor__wide">
          <label htmlFor={`zone-name-${zone.id || 'new'}`}>Delivery area</label>
          <input id={`zone-name-${zone.id || 'new'}`} value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor={`zone-fee-${zone.id || 'new'}`}>Fee in naira</label>
          <input id={`zone-fee-${zone.id || 'new'}`} type="number" min="0" step="0.01" value={form.fee} onChange={(event) => updateField('fee', event.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor={`zone-order-${zone.id || 'new'}`}>Display order</label>
          <input id={`zone-order-${zone.id || 'new'}`} type="number" min="0" step="1" value={form.sort_order} onChange={(event) => updateField('sort_order', event.target.value)} required />
        </div>
        <div className="form-field admin-editor__wide">
          <label htmlFor={`zone-details-${zone.id || 'new'}`}>Customer message</label>
          <textarea id={`zone-details-${zone.id || 'new'}`} rows="2" maxLength="500" value={form.details || ''} onChange={(event) => updateField('details', event.target.value)} />
        </div>
      </div>

      <div className="admin-check-list">
        <label className="admin-check">
          <input type="checkbox" checked={form.needs_quote} onChange={(event) => updateField('needs_quote', event.target.checked)} />
          <span>Call the customer to confirm the fee</span>
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={form.is_active} onChange={(event) => updateField('is_active', event.target.checked)} />
          <span>Show this area at checkout</span>
        </label>
      </div>

      <div className="admin-editor__actions">
        <p className={state === 'error' ? 'admin-save-message admin-save-message--error' : 'admin-save-message'} role="status">{message}</p>
        {onCancel && <button className="button button--outline" type="button" onClick={onCancel}>Cancel</button>}
        <button className="button button--gold" type="submit" disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving...' : isNew ? 'Add delivery area' : 'Save delivery area'}
        </button>
      </div>
    </form>
  )
}

export default function AdminCatalog({ accessToken, section }) {
  const [products, setProducts] = useState([])
  const [deliveryZones, setDeliveryZones] = useState([])
  const [state, setState] = useState('loading')
  const [adding, setAdding] = useState(false)

  const loadCatalog = async () => {
    setState('loading')

    try {
      const data = await getAdminCatalog(accessToken)
      setProducts(data.products)
      setDeliveryZones(data.deliveryZones)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [accessToken])

  useEffect(() => {
    setAdding(false)
  }, [section])

  if (state === 'loading') {
    return <div className="admin-loading" aria-live="polite">Loading {section === 'products' ? 'products' : 'delivery areas'}...</div>
  }

  if (state === 'error') {
    return (
      <div className="status-panel">
        <h2>These settings could not be loaded</h2>
        <p>Check the API connection and try again.</p>
        <button className="button button--gold" type="button" onClick={loadCatalog}>Try again</button>
      </div>
    )
  }

  const isProducts = section === 'products'
  const items = isProducts ? products : deliveryZones
  const updateItem = (saved) => {
    const setter = isProducts ? setProducts : setDeliveryZones
    setter((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [...current, saved])
    setAdding(false)
  }

  return (
    <section className="admin-catalog" aria-label={isProducts ? 'Products' : 'Delivery areas'}>
      <div className="admin-section-heading">
        <div>
          <h2>{isProducts ? 'Products' : 'Delivery areas'}</h2>
          <p>{isProducts ? 'Update prices, stock and product photos.' : 'Control fees and the areas shown at checkout.'}</p>
        </div>
        {!adding && (
          <button className="button button--gold" type="button" onClick={() => setAdding(true)}>
            {isProducts ? 'Add product' : 'Add delivery area'}
          </button>
        )}
      </div>

      {adding && (
        <div className="admin-new-card">
          <h3>{isProducts ? 'New product' : 'New delivery area'}</h3>
          {isProducts
            ? <ProductEditor accessToken={accessToken} onSaved={updateItem} onCancel={() => setAdding(false)} />
            : <DeliveryZoneEditor accessToken={accessToken} onSaved={updateItem} onCancel={() => setAdding(false)} />}
        </div>
      )}

      <div className="admin-catalog-list">
        {items.map((item) => (
          <details className={isProducts ? 'admin-catalog-card' : 'admin-catalog-card admin-catalog-card--delivery'} key={item.id}>
            <summary>
              {isProducts && (
                item.image_url
                  ? <img src={item.image_url} alt="" loading="lazy" />
                  : <span className="admin-product-placeholder" aria-hidden="true">AG</span>
              )}
              <span className="admin-catalog-card__name">
                <strong>{item.name}</strong>
                <small>{isProducts
                  ? `${formatPrice(item.price)} · ${item.stock} in stock`
                  : item.needs_quote ? 'Fee confirmed by phone' : formatPrice(item.fee)}</small>
              </span>
              <span className={item.is_active ? 'admin-state admin-state--active' : 'admin-state'}>
                {item.is_active ? 'Active' : 'Hidden'}
              </span>
            </summary>
            {isProducts
              ? <ProductEditor product={item} accessToken={accessToken} onSaved={updateItem} />
              : <DeliveryZoneEditor zone={item} accessToken={accessToken} onSaved={updateItem} />}
          </details>
        ))}
      </div>
    </section>
  )
}
