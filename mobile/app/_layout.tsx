import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import store from '../src/store';
import { injectStore } from '../src/api/client';
import { bootstrapAuth } from '../src/store/slices/authSlice';
import { bootstrapApp } from '../src/store/appSlice';

// ─── Inject the Redux store into the Axios client ─────────────────────────────
// This MUST be called before any API requests are made so that the interceptor
// can read the auth token from the Redux state.
injectStore(store);

// ─── Public routes that authenticated users should NOT see ────────────────────
const PUBLIC_ROUTES = ['index', 'login', 'register', 'otp-verify'];

function AuthWrapper() {
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isInitialized } = useSelector((state) => state.auth);
  const isAppInitialized = useSelector((state) => state.app.isAppInitialized);

  // Use a ref to prevent navigation running before the router is ready
  const isMounted = useRef(false);

  // Bootstrap on mount: restore language + auth session
  useEffect(() => {
    dispatch(bootstrapApp());
    dispatch(bootstrapAuth());
  }, [dispatch]);

  // Mark mounted after first render so navigation is safe
  useEffect(() => {
    isMounted.current = true;
  }, []);

  // Auth-based routing — only runs once both bootstraps are complete
  useEffect(() => {
    if (!isInitialized || !isAppInitialized || !isMounted.current) return;

    const currentRoute = segments[0] ?? 'index';
    const isOnPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    console.log('[Nav] user:', !!user, '| route:', currentRoute, '| public:', isOnPublicRoute);

    if (user && isOnPublicRoute) {
      // Logged in but still on a public page → go to Home Tab
      console.log('[Nav] Authenticated — redirecting to /(tabs)/home');
      router.replace('/(tabs)/home');
    } else if (!user && !isOnPublicRoute) {
      // Not logged in and trying to access a protected page → go to Splash
      console.log('[Nav] Not authenticated — redirecting to /');
      router.replace('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isInitialized, isAppInitialized]);

  // Show loading spinner while either bootstrap is running
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
      <AuthWrapper />
      <Toast />
    </Provider>
  );
}
