import { Tabs } from 'expo-router'
import { colors } from '@/constants/brand'
import { useCart } from '@/context/CartContext'

export default function TabsLayout() {
  const { itemCount } = useCart()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenDeep,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          minHeight: 66,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.line,
          backgroundColor: colors.surface
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '800'
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Shop' }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.gold, color: colors.ink }
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  )
}
