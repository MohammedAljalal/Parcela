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

import { loginUser, loginWithGoogle } from '../store/slices/authSlice';
import TabSwitch from '../components/TabSwitch';
import Input from '../components/Input';
import Button from '../components/Button';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

// ─── Constants ───────────────────────────────────────────────────────────────

WebBrowser.maybeCompleteAuthSession();

const TABS = [
  { key: 'phone', label: 'Telefone' },
  { key: 'email', label: 'Email' },
];

// Country codes list (extend as needed)
const COUNTRY_CODES = [
  { code: '+238', flag: '🇨🇻', iso: 'CV' }, // Cabo Verde — shown first (default)
  { code: '+351', flag: '🇵🇹', iso: 'PT' },
  { code: '+44',  flag: '🇬🇧', iso: 'GB' },
  { code: '+1',   flag: '🇺🇸', iso: 'US' },
];

// ─── Logo (rounded square with box icon) ─────────────────────────────────────
const AppLogo = () => (
  <View style={styles.logoBox}>
    {/* Simple box/package icon made of shapes */}
    <View style={styles.boxIcon}>
      {/* top lid */}
      <View style={styles.boxLid} />
      {/* body */}
      <View style={styles.boxBody}>
        <View style={styles.boxStripe} />
      </View>
    </View>
  </View>
);

// ─── Country code picker (simplified inline) ─────────────────────────────────
const CountryPicker = ({ selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const country = COUNTRY_CODES.find((c) => c.code === selected) || COUNTRY_CODES[0];

  return (
    <View>
      <TouchableOpacity
        style={styles.countryTrigger}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.countryFlag}>{country.flag}</Text>
        <Text style={styles.countryCode}>{country.code}</Text>
        <Text style={styles.countryChevron}>▾</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.countryDropdown}>
          {COUNTRY_CODES.map((c) => (
            <TouchableOpacity
              key={c.iso}
              style={styles.countryOption}
              onPress={() => {
                onSelect(c.code);
                setOpen(false);
              }}
            >
              <Text style={styles.countryFlag}>{c.flag}</Text>
              <Text style={styles.countryCode}>{c.code}</Text>
              <Text style={styles.countryIso}>{c.iso}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Google Icon ─────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <Text style={styles.googleLetter}>G</Text>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux state
  const { loading, error } = useSelector((state) => state.auth);

  // Google Auth Session
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
    androidClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
    iosClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
    webClientId: '623297773074-6n0m3e5qhrfgsegcq90ejr2s9r686621.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleSuccess(authentication.idToken);
      }
    } else if (response?.type === 'error') {
      console.error('Google login error:', response.error);
    }
  }, [response]);

  const handleGoogleSuccess = async (idToken) => {
    const result = await dispatch(loginWithGoogle(idToken));
    if (result.success) {
      router.push('/home');
    }
  };

  // Tab state
  const [activeTab, setActiveTab] = useState('phone');

  // Phone tab state
  const [countryCode, setCountryCode] = useState('+238');
  const [phone, setPhone] = useState('');

  // Email tab state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Determine if the primary button should be enabled
  const isPhoneValid = phone.trim().length >= 6;
  const isEmailValid = email.trim().length > 3 && password.trim().length >= 6;
  const canContinue = activeTab === 'phone' ? isPhoneValid : isEmailValid;

  const handleContinue = async () => {
    let credentials = {};
    if (activeTab === 'phone') {
      credentials = { type: 'phone', phone: `${countryCode}${phone}` };
    } else {
      credentials = { type: 'email', email, password };
    }

    const result = await dispatch(loginUser(credentials));
    if (result.success) {
      router.push('/home');
    }
  };

  const handleGoogle = () => {
    promptAsync({ windowName: '_self' });
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
            <Text style={styles.appName}>Parcela</Text>
            <Text style={styles.tagline}>Entrega rápida, confiança garantida.</Text>
          </View>

          {/* ── Login card ── */}
          <View style={styles.card}>
            {/* Tab switcher */}
            <TabSwitch
              tabs={TABS}
              active={activeTab}
              onChange={setActiveTab}
            />

            {/* Global Error Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.globalError}>{error}</Text>
              </View>
            ) : null}

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
                    <CountryPicker
                      selected={countryCode}
                      onSelect={setCountryCode}
                    />
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
              label={activeTab === 'phone' ? 'Enviar Código' : 'Continuar'}
              onPress={handleContinue}
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

            {/* ── Sign up link ── */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Não tem uma conta? </Text>
              <TouchableOpacity activeOpacity={0.7} disabled={loading} onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Registe-se</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Footer ── */}
          <Text style={styles.footer}>© 2024 Parcela S.A., Cabo Verde</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPaddingH,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },

  // ── Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.primaryCircle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    // Shadow
    shadowColor: colors.shadowPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  // Box/package icon
  boxIcon: {
    width: 36,
    height: 32,
    alignItems: 'center',
  },
  boxLid: {
    width: 34,
    height: 10,
    backgroundColor: colors.textOnPrimary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginBottom: 2,
    opacity: 0.9,
  },
  boxBody: {
    width: 34,
    height: 20,
    backgroundColor: colors.textOnPrimary,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  boxStripe: {
    width: 14,
    height: 3,
    backgroundColor: colors.primaryCircle,
    borderRadius: 2,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },

  // ── Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusXl,
    padding: spacing.xxl,
    // iOS shadow
    shadowColor: colors.shadowNeutral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    // Android
    elevation: 4,
    marginBottom: spacing.xl,
  },

  // ── Country picker
  countryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  countryChevron: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  countryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 999,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowNeutral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 130,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  countryIso: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 'auto',
  },

  // ── Error Container
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.lg,
  },
  globalError: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },

  // ── Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  disabledGoogleBtn: {
    opacity: 0.6,
  },
  googleLetter: {
    fontSize: 18,
    fontWeight: '700',
    // Google brand blue
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },

  // ── Sign up
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signupText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // ── Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  },
});

export default LoginScreen;
