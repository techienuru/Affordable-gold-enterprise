import { useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import AppButton from '@/components/AppButton'
import FormField from '@/components/FormField'
import ProductArtwork from '@/components/ProductArtwork'
import { colors, radius, spacing } from '@/constants/brand'
import { saveAdminProduct } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { uploadProductImage } from '@/lib/supabase'
import type { Product } from '@/types'

const emptyProduct: Product = {
  id: '',
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

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

function ProductEditor({ product, accessToken, onSaved, onCancel }: {
  product: Product
  accessToken: string
  onSaved: (product: Product) => void
  onCancel: () => void
}) {
  const isNew = !product.id
  const [name, setName] = useState(product.name)
  const [slug, setSlug] = useState(product.slug || '')
  const [category, setCategory] = useState(product.category || '')
  const [description, setDescription] = useState(product.description || '')
  const [price, setPrice] = useState(String(product.price))
  const [unit, setUnit] = useState(product.unit || '')
  const [stock, setStock] = useState(String(product.stock))
  const [imageUrl] = useState(product.image_url || '')
  const [selectedPhoto, setSelectedPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [active, setActive] = useState(product.is_active !== false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const changeName = (value: string) => {
    setName(value)
    if (isNew) setSlug(slugify(value))
  }

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setMessage('Allow photo access to choose a product image.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75
    })

    if (!result.canceled) {
      setSelectedPhoto(result.assets[0])
      setMessage('')
    }
  }

  const save = async () => {
    setSaving(true)
    setMessage('')

    try {
      let savedImageUrl = imageUrl

      if (selectedPhoto) {
        savedImageUrl = await uploadProductImage(
          selectedPhoto.uri,
          selectedPhoto.mimeType || 'image/jpeg',
          selectedPhoto.fileSize
        )
      }

      const saved = await saveAdminProduct(accessToken, product.id || null, {
        name,
        slug,
        category,
        description,
        price,
        unit,
        imageUrl: savedImageUrl,
        stock,
        isActive: active
      })
      onSaved(saved)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The product could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const preview: Product = {
    ...product,
    name: name || 'New product',
    image_url: selectedPhoto?.uri || imageUrl
  }

  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>{isNew ? 'New product' : `Edit ${product.name}`}</Text>
      <ProductArtwork product={preview} />
      <AppButton label={selectedPhoto ? 'Choose another photo' : 'Choose product photo'} variant="outline" onPress={choosePhoto} />
      <FormField label="Product name" value={name} onChangeText={changeName} />
      <FormField label="Product link" hint="Lowercase letters, numbers and hyphens." value={slug} onChangeText={(value) => setSlug(slugify(value))} autoCapitalize="none" />
      <FormField label="Category" value={category} onChangeText={setCategory} />
      <FormField label="Unit" value={unit} onChangeText={setUnit} placeholder="For example: 1 litre" />
      <FormField label="Price in naira" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <FormField label="Stock quantity" value={stock} onChangeText={setStock} keyboardType="number-pad" />
      <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>Show in the shop</Text>
          <Text style={styles.switchMessage}>Turn this off to hide the product without deleting it.</Text>
        </View>
        <Switch value={active} onValueChange={setActive} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.surface} />
      </View>
      {message ? <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text> : null}
      <View style={styles.actions}>
        <AppButton label="Cancel" variant="outline" onPress={onCancel} style={styles.action} />
        <AppButton label={isNew ? 'Add product' : 'Save product'} loading={saving} onPress={save} style={styles.action} />
      </View>
    </View>
  )
}

export default function AdminProducts({ products, accessToken, onSaved }: {
  products: Product[]
  accessToken: string
  onSaved: (product: Product) => void
}) {
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)

  if (adding) {
    return <ProductEditor product={emptyProduct} accessToken={accessToken} onSaved={(product) => { onSaved(product); setAdding(false) }} onCancel={() => setAdding(false)} />
  }

  if (editing) {
    return <ProductEditor product={editing} accessToken={accessToken} onSaved={(product) => { onSaved(product); setEditing(null) }} onCancel={() => setEditing(null)} />
  }

  return (
    <View style={styles.list}>
      <AppButton label="Add product" onPress={() => setAdding(true)} />
      {products.map((product) => (
        <Pressable
          key={product.id}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${product.name}`}
          onPress={() => setEditing(product)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <ProductArtwork product={product} compact />
          <View style={styles.cardCopy}>
            <Text style={styles.cardName}>{product.name}</Text>
            <Text style={styles.cardMeta}>{formatPrice(product.price)} · {product.stock} in stock</Text>
            <Text style={[styles.state, product.is_active !== false && styles.active]}>{product.is_active === false ? 'Hidden' : 'Active'}</Text>
          </View>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  card: {
    minHeight: 106,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  pressed: {
    backgroundColor: colors.goldSoft
  },
  cardCopy: {
    flex: 1
  },
  cardName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  cardMeta: {
    marginTop: 3,
    color: colors.inkSoft,
    fontSize: 12
  },
  state: {
    marginTop: 7,
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '900'
  },
  active: {
    color: colors.green
  },
  edit: {
    color: colors.greenDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  editor: {
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  },
  editorTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '900'
  },
  switchRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  switchCopy: {
    flex: 1
  },
  switchTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  switchMessage: {
    marginTop: 3,
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 17
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  action: {
    flex: 1
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  }
})
