import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import store from '../src/store';
import { injectStore } from '../src/api/client';
import { bootstrapAuth } from '../src/store/slices/authSlice';
import { bootstrapApp } from '../src/store/appSlice';
import { StripeAppProvider } from '../src/components/StripeWrapper';

// ─── Inject the Redux store into the Axios client ─────────────────────────────
injectStore(store);

// Publishable key from .env (EXPO_PUBLIC_ prefix makes it available at runtime)
const STRIPE_PK =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  Constants.expoConfig?.extra?.stripePublishableKey ??
  '';

// ─── Public routes that authenticated users should NOT see ────────────────────
const PUBLIC_ROUTES = ['index', 'login', 'register', 'otp-verify'];

function AuthWrapper() {
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isInitialized } = useSelector((state) => state.auth);
  const isAppInitialized = useSelector((state) => state.app.isAppInitialized);

  const isMounted = useRef(false);

  useEffect(() => {
    dispatch(bootstrapApp());
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (!isInitialized || !isAppInitialized || !isMounted.current) return;

    const currentRoute = segments[0] ?? 'index';
    const isOnPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    if (user && isOnPublicRoute) {
      router.replace('/(tabs)/home');
    } else if (!user && !isOnPublicRoute) {
      router.replace('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isInitialized, isAppInitialized]);

  if (!isInitialized || !isAppInitialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      {/* StripeAppProvider wraps the whole app so any screen can use Stripe */}
      <StripeAppProvider publishableKey={STRIPE_PK}>
        <AuthWrapper />
        <Toast />
      </StripeAppProvider>
    </Provider>
  );
}
