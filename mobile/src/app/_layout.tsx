import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { colors } from '@/constants/brand'

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.paper },
            headerStyle: { backgroundColor: colors.greenDeep },
            headerTintColor: colors.surface,
            headerTitleStyle: { fontWeight: '800' },
            headerBackButtonDisplayMode: 'minimal'
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="admin" options={{ title: 'Shop admin' }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  )
}
