import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import colors from '../../src/theme/colors';

export default function TabLayout() {
  const { t } = useTranslation();
  // Read live cart count from Redux so badge updates in real-time
  const cartItemCount = useSelector((state) => state.cart?.itemCount ?? 0);
  // Bottom inset accounts for the phone's gesture/navigation bar
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#777777',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: 70 + bottom,
          paddingBottom: 12 + bottom,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View
              style={{
                width: 44,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                backgroundColor: focused ? '#FFC107' : 'transparent',
              }}
            >
              <Ionicons name={iconName} size={22} color={focused ? '#1A1A1A' : '#777777'} />

              {/* Cart badge — shows real count from Redux, hidden when 0 */}
              {route.name === 'cart' && cartItemCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: 0,
                    backgroundColor: '#EF4444',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('tabs.categories'),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
