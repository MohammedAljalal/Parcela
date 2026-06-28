import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import CountryPickerModal from '../components/CountryPickerModal';

import { registerUser, loginWithGoogle, clearError, sendOtp } from '../store/slices/authSlice';
import toast from '../utils/toast';
import TabSwitch from '../components/TabSwitch';
import Input from '../components/Input';
import Button from '../components/Button';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

// ─── Constants ────────────────────────────────────────────────────────────────

WebBrowser.maybeCompleteAuthSession();

const TABS = [
  { key: 'phone', label: 'Telefone' },
  { key: 'email', label: 'Email' },
];

// Custom COUNTRY_CODES removed, replaced by react-native-country-picker-modal

// ─── Logo ─────────────────────────────────────────────────────────────────────
const AppLogo = () => (
  <View style={styles.logoBox}>
    <View style={styles.boxIcon}>
      <View style={styles.boxLid} />
      <View style={styles.boxBody}>
        <View style={styles.boxStripe} />
      </View>
    </View>
  </View>
);

// Custom CountryPicker removed

// ─── Google Icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <Text style={styles.googleLetter}>G</Text>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RegisterScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  // Google Auth Session (same client IDs as LoginScreen)
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
    androidClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
    iosClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
    webClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
  });

  // Handle Google auth response
  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const { authentication } = response;
      const token = authentication?.idToken ?? authentication?.accessToken;
      if (token) {
        console.log('[Google/Register] Auth success — dispatching loginWithGoogle');
        dispatch(loginWithGoogle(token))
          .unwrap()
          .then(() => toast.success('Conta criada!', 'Bem-vindo'))
          .catch((err) => {
            toast.error(typeof err === 'string' ? err : 'Falha ao autenticar', 'Erro Google');
          });
      } else {
        console.error('[Google/Register] No token in response:', authentication);
      }
    } else if (response.type === 'error') {
      console.error('[Google/Register] Auth error:', response.error);
    }
  }, [response, dispatch]);

  // Clear error on mount and unmount
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState('phone');

  const handleTabChange = (tab) => {
    dispatch(clearError());
    setActiveTab(tab);
  };

  // Form states
  const [name, setName] = useState('');
  const [countryIso, setCountryIso] = useState('CV');
  const [callingCode, setCallingCode] = useState('+238');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isPhoneValid = name.trim().length > 2 && phone.trim().length >= 6;
  const isEmailValid = name.trim().length > 2 && email.trim().length > 3 && password.trim().length >= 6;
  const canContinue = activeTab === 'phone' ? isPhoneValid : isEmailValid;

  const handleRegister = () => {
    if (activeTab === 'phone') {
      const fullPhone = `${callingCode}${phone.trim()}`;
      dispatch(sendOtp(fullPhone))
        .unwrap()
        .then(() => {
          toast.info(`Código enviado para ${fullPhone}`);
          router.push({ pathname: '/otp-verify', params: { phone: fullPhone, prefilledName: name } });
        })
        .catch((err) => {
          toast.error(typeof err === 'string' ? err : 'Falha ao enviar código', 'Erro');
        });
    } else {
      const credentials = { type: 'email', name, email, password };
      dispatch(registerUser(credentials))
        .unwrap()
        .then(() => toast.success('Conta criada com sucesso!', 'Bem-vindo'))
        .catch((err) => {
          toast.error(typeof err === 'string' ? err : 'Falha ao criar conta', 'Erro');
        });
    }
  };

  const handleGoogle = () => {
    dispatch(clearError());
    console.log('[Google/Register] Initiating auth flow...');
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <AppLogo />
            <Text style={styles.appName}>Criar Conta</Text>
            <Text style={styles.tagline}>Junte-se à Parcela hoje.</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <TabSwitch
              tabs={TABS}
              active={activeTab}
              onChange={handleTabChange}
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.globalError}>{error}</Text>
              </View>
            ) : null}

            {/* ── Common Name Input ── */}
            <Input
              label="Nome Completo"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              editable={!loading}
            />

            {/* ── Phone tab ── */}
            {activeTab === 'phone' && (
              <View>
                <Input
                  label="Número de Telefone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="000 00 00"
                  keyboardType="phone-pad"
                  leftSlot={
                    <View style={{ paddingVertical: 4 }}>
                      <CountryPickerModal
                        countryIso={countryIso}
                        callingCode={callingCode}
                        onSelect={(c) => {
                          setCountryIso(c.iso);
                          setCallingCode(c.code);
                        }}
                        disabled={loading}
                      />
                    </View>
                  }
                  editable={!loading}
                />
              </View>
            )}

            {/* ── Email tab ── */}
            {activeTab === 'email' && (
              <View>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seuemail@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Input
                  label="Palavra-passe"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureText
                  editable={!loading}
                />
              </View>
            )}

            {/* ── Primary CTA ── */}
            <Button
              label="Criar Conta"
              onPress={handleRegister}
              disabled={!canContinue || loading}
              loading={loading}
            />

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Google button ── */}
            <TouchableOpacity
              style={[styles.googleButton, (loading || !request) && styles.disabledGoogleBtn]}
              onPress={handleGoogle}
              activeOpacity={0.8}
              disabled={loading || !request}
            >
              <GoogleIcon />
              <Text style={styles.googleLabel}>Continuar com Google</Text>
            </TouchableOpacity>

            {/* ── Login link ── */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Já tem uma conta? </Text>
              <TouchableOpacity activeOpacity={0.7} disabled={loading} onPress={() => router.replace('/login')}>
                <Text style={styles.signupLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.screenPaddingH, paddingTop: spacing.xxxl, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  logoBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: colors.primaryCircle, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, shadowColor: colors.shadowPrimary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  boxIcon: { width: 36, height: 32, alignItems: 'center' },
  boxLid: { width: 34, height: 10, backgroundColor: colors.textOnPrimary, borderTopLeftRadius: 3, borderTopRightRadius: 3, marginBottom: 2, opacity: 0.9 },
  boxBody: { width: 34, height: 20, backgroundColor: colors.textOnPrimary, borderRadius: 3, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  boxStripe: { width: 14, height: 3, backgroundColor: colors.primaryCircle, borderRadius: 2 },
  appName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3, marginBottom: spacing.xs },
  tagline: { fontSize: 13, color: colors.textSecondary, letterSpacing: 0.1 },
  card: { backgroundColor: colors.surface, borderRadius: spacing.radiusXl, padding: spacing.xxl, shadowColor: colors.shadowNeutral, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, marginBottom: spacing.xl },
  // Custom country picker styles removed
  errorContainer: { backgroundColor: '#FEE2E2', padding: spacing.md, borderRadius: spacing.radiusMd, marginBottom: spacing.lg },
  globalError: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl, gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 1.2 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: spacing.radiusMd, paddingVertical: 14, backgroundColor: colors.surface },
  disabledGoogleBtn: { opacity: 0.6 },
  googleLetter: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, letterSpacing: 0.1 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  signupText: { fontSize: 13, color: colors.textSecondary },
  signupLink: { fontSize: 13, fontWeight: '600', color: colors.primary, textDecorationLine: 'underline' },
});

export default RegisterScreen;
