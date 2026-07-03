import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import { useEffect } from 'react';
import CountryPickerModal from '../components/CountryPickerModal';

import {
  loginUser,
  loginWithGoogle,
  clearError,
  sendOtp,
} from '../store/slices/authSlice';
import toast from '../utils/toast';

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 24;

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#1C3375',  // dark navy blue (Figma button color)
  primaryLight:  '#E8EEF9',
  bg:            '#F2F4F8',
  surface:       '#FFFFFF',
  textPrimary:   '#0D1B2A',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  border:        '#E2E6EF',
  borderActive:  '#1A3FB8',
  danger:        '#EF4444',
  dangerBg:      '#FEE2E2',
  divider:       '#E5E7EB',
  google:        '#4285F4',
};

// Removed custom COUNTRY_CODES array as we now use react-native-country-picker-modal

// ─── Validation helpers ─────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = (v) => v.replace(/\D/g, '').length >= 6;

// ─── App Logo ──────────────────────────────────────────────────────────────────
const AppLogo = React.memo(() => (
  <View style={s.logoBox} accessibilityRole="image" accessibilityLabel="Parcela logo">
    <View style={s.boxIcon}>
      <View style={s.boxLid} />
      <View style={s.boxBody}>
        <View style={s.boxStripe} />
      </View>
    </View>
  </View>
));
AppLogo.displayName = 'AppLogo';

// ─── Tab Switcher ──────────────────────────────────────────────────────────────
const TabBar = React.memo(({ tabs, active, onChange, disabled }) => (
  <View style={s.tabBar}>
    {tabs.map((tab) => {
      const isActive = tab.key === active;
      return (
        <TouchableOpacity
          key={tab.key}
          style={s.tab}
          onPress={() => onChange(tab.key)}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: isActive }}
        >
          <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
            {tab.label}
          </Text>
          <View style={[s.tabIndicator, isActive && s.tabIndicatorActive]} />
        </TouchableOpacity>
      );
    })}
  </View>
));
TabBar.displayName = 'TabBar';

// Removed custom CountryPicker component in favor of react-native-country-picker-modal

// ─── Phone Input ───────────────────────────────────────────────────────────────
const PhoneInput = React.memo(({
  countryIso, callingCode, onCountryChange,
  value, onChangeText,
  label, placeholder,
  error, disabled,
}) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? C.danger : focused ? C.borderActive : C.border;

  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <View style={[s.fieldRow, { borderColor }]}>
        <View style={s.fieldLeft}>
          <CountryPickerModal
            countryIso={countryIso}
            callingCode={callingCode}
            onSelect={onCountryChange}
            disabled={disabled}
          />
        </View>
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          keyboardType="phone-pad"
          autoComplete="tel"
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint="Enter your phone number"
        />
      </View>
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
});
PhoneInput.displayName = 'PhoneInput';

// ─── Text Field (email / password) ────────────────────────────────────────────
const TextField = React.memo(({
  label, value, onChangeText,
  placeholder, keyboardType = 'default',
  autoCapitalize = 'none', secureText = false,
  error, disabled,
}) => {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureText);
  const borderColor = error ? C.danger : focused ? C.borderActive : C.border;

  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <View style={[s.fieldRow, { borderColor }]}>
        <TextInput
          style={[s.fieldInput, { paddingLeft: 16 }]}
          value={value}
          onChangeText={(v) => onChangeText(v.trimStart())}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secure}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />
        {secureText && (
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setSecure((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
          >
            <Text style={[s.eyeIcon, { opacity: secure ? 0.45 : 1 }]}>👁</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
});
TextField.displayName = 'TextField';

// ─── Primary Button ────────────────────────────────────────────────────────────
const PrimaryButton = React.memo(({ label, onPress, loading, disabled }) => (
  <TouchableOpacity
    style={[s.primaryBtn, disabled && s.primaryBtnDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.88}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
  >
    {loading
      ? <ActivityIndicator color={C.textOnPrimary} />
      : <Text style={s.primaryBtnLabel}>{label}</Text>
    }
  </TouchableOpacity>
));
PrimaryButton.displayName = 'PrimaryButton';

// ─── Google Button ─────────────────────────────────────────────────────────────
const GoogleButton = React.memo(({ label, onPress, loading, disabled }) => (
  <TouchableOpacity
    style={[s.googleBtn, disabled && s.googleBtnDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {loading ? (
      <ActivityIndicator color={C.textPrimary} size="small" />
    ) : (
      <>
        <Text style={s.googleG}>G</Text>
        <Text style={s.googleLabel}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
));
GoogleButton.displayName = 'GoogleButton';

// ─── Error Banner ──────────────────────────────────────────────────────────────
const ErrorBanner = React.memo(({ message }) => (
  message ? (
    <View style={s.errorBanner}>
      <Text style={s.errorBannerText}>{message}</Text>
    </View>
  ) : null
));
ErrorBanner.displayName = 'ErrorBanner';

// ─── Divider "OU" ──────────────────────────────────────────────────────────────
const Divider = React.memo(({ label }) => (
  <View style={s.dividerRow}>
    <View style={s.dividerLine} />
    <Text style={s.dividerLabel}>{label}</Text>
    <View style={s.dividerLine} />
  </View>
));
Divider.displayName = 'Divider';

// ─── Main Screen ──────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const router    = useRouter();
  const dispatch  = useDispatch();
  const { t }     = useTranslation();
  const { loading, loadingOtp, error } = useSelector((s) => s.auth);

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState('phone');
  const tabs = useMemo(() => [
    { key: 'phone', label: t('login.tabPhone') },
    { key: 'email', label: t('login.tabEmail') },
  ], [t]);

  const handleTabChange = useCallback((key) => {
    dispatch(clearError());
    setActiveTab(key);
    setActiveAction(null);
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
  }, [dispatch]);

  // ── Phone ──
  const [countryIso, setCountryIso]   = useState('CV');
  const [callingCode, setCallingCode] = useState('+238');
  const [phone, setPhone]             = useState('');
  const [phoneError, setPhoneError]   = useState('');

  // ── Email ──
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [emailError, setEmailError]   = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ── Derived ──
  const [activeAction, setActiveAction] = useState(null);
  const isBusy = activeTab === 'phone' ? loadingOtp : loading;

  // ── Google Auth ──
  const handleGoogleAuth = useCallback(async () => {
    dispatch(clearError());
    setActiveAction('google');
    try {
      const appRedirect = Linking.createURL('/');
      const backendUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000/api').replace(/\/api\/?$/, '');
      const authUrl = `${backendUrl}/api/auth/google/start?app_redirect=${encodeURIComponent(appRedirect)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirect);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        const idToken = queryParams?.idToken;
        if (!idToken) throw new Error('لم يتم استلام idToken من الباك اند');

        await dispatch(loginWithGoogle(idToken)).unwrap();
        toast.success('Bem-vindo!', 'Login com Google');
      } else {
        setActiveAction(null);
      }
    } catch (err) {
      setActiveAction(null);
      toast.error(typeof err === 'string' ? err : 'Falha ao autenticar', 'Erro Google');
    }
  }, [dispatch]);

  // Clear global error on tab change / unmount
  useEffect(() => {
    dispatch(clearError());
    return () => { dispatch(clearError()); };
  }, [activeTab, dispatch]);

  // ── Validate & Submit ──
  const handleContinue = useCallback(() => {
    setActiveAction(activeTab);
    if (activeTab === 'phone') {
      if (!isValidPhone(phone)) {
        setPhoneError(t('login.errorPhoneMin'));
        return;
      }
      setPhoneError('');
      const fullPhone = `${callingCode}${phone.trim()}`;
      dispatch(sendOtp(fullPhone))
        .unwrap()
        .then(() => {
          setActiveAction(null);
          toast.info(`Código enviado para ${fullPhone}`);
          router.push({ pathname: '/otp-verify', params: { phone: fullPhone } });
        })
        .catch((err) => {
          setActiveAction(null);
          toast.error(typeof err === 'string' ? err : 'Falha ao enviar código', 'Erro');
        });
    } else {
      let valid = true;
      if (!email.trim() || !isValidEmail(email)) {
        setEmailError(t('login.errorEmail'));
        valid = false;
      } else setEmailError('');

      if (!password || password.length < 6) {
        setPasswordError(t('login.errorPasswordMin'));
        valid = false;
      } else setPasswordError('');

      if (!valid) {
        setActiveAction(null);
        return;
      }
      dispatch(loginUser({ type: 'email', email: email.trim(), password }))
        .unwrap()
        .then(() => {
          toast.success('Sessão iniciada com sucesso!', 'Bem-vindo');
        })
        .catch((err) => {
          setActiveAction(null);
          toast.error(typeof err === 'string' ? err : 'Falha ao iniciar sessão', 'Erro');
        });
    }
  }, [activeTab, phone, callingCode, email, password, dispatch, router, t]);

  const handleGoogle = handleGoogleAuth;

  // ── CTA disabled? ──
  const canSubmit = useMemo(() => {
    if (activeTab === 'phone') return isValidPhone(phone);
    return email.trim().length > 3 && password.length >= 6;
  }, [activeTab, phone, email, password]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Hero ── */}
          <View style={s.hero}>
            <AppLogo />
            <Text style={s.appName}>Parcela</Text>
            <Text style={s.tagline}>{t('login.tagline')}</Text>
          </View>

          {/* ── Card ── */}
          <View style={s.card}>

            {/* Tab Bar */}
            <TabBar
              tabs={tabs}
              active={activeTab}
              onChange={handleTabChange}
              disabled={isBusy}
            />

            {/* Error Banner */}
            <ErrorBanner message={error} />

            {/* ── Phone Tab ── */}
            {activeTab === 'phone' && (
              <PhoneInput
                label={t('login.phoneLabel')}
                placeholder={t('login.phonePlaceholder')}
                countryIso={countryIso}
                callingCode={callingCode}
                onCountryChange={(c) => {
                  setCountryIso(c.iso);
                  setCallingCode(c.code);
                }}
                value={phone}
                onChangeText={(v) => { setPhone(v); setPhoneError(''); }}
                error={phoneError}
                disabled={isBusy}
              />
            )}

            {/* ── Email Tab ── */}
            {activeTab === 'email' && (
              <>
                <TextField
                  label={t('login.email')}
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setEmailError(''); }}
                  keyboardType="email-address"
                  error={emailError}
                  disabled={isBusy}
                />
                <TextField
                  label={t('login.passwordLabel')}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
                  secureText
                  error={passwordError}
                  disabled={isBusy}
                />
              </>
            )}

            {/* Primary CTA */}
            <PrimaryButton
              label={activeTab === 'phone' ? t('login.sendCode') : t('login.continue')}
              onPress={handleContinue}
              loading={isBusy && activeAction !== 'google'}
              disabled={!canSubmit || isBusy}
            />

            {/* Divider */}
            <Divider label={t('login.or')} />

            {/* Google */}
            <GoogleButton
              label={t('login.continueWithGoogle')}
              onPress={handleGoogle}
              loading={loading && activeAction === 'google'}
              disabled={loading}
            />

            {/* Sign up */}
            <View style={s.signupRow}>
              <Text style={s.signupText}>{t('login.noAccount')}</Text>
              <TouchableOpacity
                onPress={() => router.push('/register')}
                disabled={isBusy}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="link"
                accessibilityLabel={t('login.register')}
              >
                <Text style={s.signupLink}>{t('login.register')}</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Footer */}
          <Text style={s.footer}>{t('login.footer')}</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: H_PAD,
    paddingTop: 40,
    paddingBottom: 28,
  },

  // ── Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  boxIcon: { width: 36, height: 32, alignItems: 'center' },
  boxLid: { width: 34, height: 10, backgroundColor: C.textOnPrimary, borderTopLeftRadius: 3, borderTopRightRadius: 3, marginBottom: 2, opacity: 0.9 },
  boxBody: { width: 34, height: 20, backgroundColor: C.textOnPrimary, borderRadius: 3, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  boxStripe: { width: 14, height: 3, backgroundColor: C.primary, borderRadius: 2 },
  appName: {
    fontSize: 22, fontWeight: '700',
    color: C.textPrimary, letterSpacing: 0.2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13, color: C.textSecondary,
    letterSpacing: 0.1, textAlign: 'center',
  },

  // ── Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  // ── Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    marginBottom: 22,
  },
  tab: {
    flex: 1, alignItems: 'center',
    paddingBottom: 12, position: 'relative',
  },
  tabLabel: {
    fontSize: 13, fontWeight: '600',
    letterSpacing: 1.1, textTransform: 'uppercase',
    color: C.textMuted,
  },
  tabLabelActive: { color: C.primary },
  tabIndicator: {
    position: 'absolute', bottom: -1,
    left: '15%', right: '15%',
    height: 2.5, borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: { backgroundColor: C.primary },

  // ── Error Banner
  errorBanner: {
    backgroundColor: C.dangerBg,
    borderRadius: 10, padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    color: C.danger, fontSize: 13,
    textAlign: 'center', fontWeight: '500',
  },

  // ── Fields
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13, fontWeight: '500',
    color: C.textSecondary, marginBottom: 8,
    letterSpacing: 0.1,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5, borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
    elevation: 1,
    minHeight: 52,
  },
  fieldLeft: {
    paddingLeft: 12, paddingRight: 8,
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRightWidth: 1, borderRightColor: C.border,
  },
  fieldInput: {
    flex: 1, height: 52,
    fontSize: 15, color: C.textPrimary,
    paddingHorizontal: 12, letterSpacing: 0.1,
  },
  fieldError: {
    fontSize: 12, color: C.danger,
    marginTop: 4, marginLeft: 4,
  },
  eyeBtn: {
    paddingHorizontal: 12, justifyContent: 'center',
    alignSelf: 'stretch',
  },
  eyeIcon: { fontSize: 17 },

  // Removed obsolete custom picker styles

  // ── Primary Button
  primaryBtn: {
    backgroundColor: C.primary,
    height: 54, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  primaryBtnLabel: {
    color: C.textOnPrimary, fontSize: 16,
    fontWeight: '600', letterSpacing: 0.3,
  },

  // ── Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 18, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerLabel: {
    fontSize: 12, fontWeight: '600',
    color: C.textMuted, letterSpacing: 1.2,
  },

  // ── Google Button
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, height: 52,
    backgroundColor: C.surface,
  },
  googleBtnDisabled: { opacity: 0.55 },
  googleG: { fontSize: 18, fontWeight: '700', color: C.google },
  googleLabel: {
    fontSize: 15, fontWeight: '500',
    color: C.textPrimary, letterSpacing: 0.1,
  },

  // ── Sign up
  signupRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 16,
  },
  signupText: { fontSize: 13, color: C.textSecondary },
  signupLink: {
    fontSize: 13, fontWeight: '600',
    color: C.primary, textDecorationLine: 'underline',
  },

  // ── Footer
  footer: {
    textAlign: 'center', fontSize: 11,
    color: C.textMuted, letterSpacing: 0.2,
  },
});

export default LoginScreen;
