import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from '../src/store';
import { loadUserFromStorage } from '../src/store/slices/authSlice';

// Public routes that authenticated users should NOT see
const PUBLIC_ROUTES = ['index', 'login', 'register'];

function AuthWrapper() {
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isInitialized } = useSelector((state) => state.auth);

  // Load user from AsyncStorage once on mount
  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, []);

  // Auth-based routing
  useEffect(() => {
    if (!isInitialized) return;

    const currentRoute = segments[0] ?? 'index';
    const isOnPublicRoute = PUBLIC_ROUTES.includes(currentRoute);
    const isOnHome = currentRoute === 'home';

    if (user && isOnPublicRoute) {
      // Logged in but on a public page → go home
      router.replace('/home');
    } else if (!user && isOnHome) {
      // Not logged in but trying to access protected page → go to splash
      router.replace('/');
    }
  }, [user, isInitialized, segments[0]]);

  // Show loading spinner while checking AsyncStorage
  if (!isInitialized) {
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
    </Provider>
  );
}
