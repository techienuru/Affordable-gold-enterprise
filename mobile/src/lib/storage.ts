import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const canUseBrowserStorage = () => (
  Platform.OS === 'web' && typeof window !== 'undefined'
)

export const persistentStorage = {
  getItem: async (key: string) => {
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(key)
    if (!canUseBrowserStorage()) return null

    return window.localStorage.getItem(key)
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value)
      return
    }

    if (canUseBrowserStorage()) window.localStorage.setItem(key, value)
  },
  removeItem: async (key: string) => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key)
      return
    }

    if (canUseBrowserStorage()) window.localStorage.removeItem(key)
  }
}
