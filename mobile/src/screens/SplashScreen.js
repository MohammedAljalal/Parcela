import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { setLanguagePersisted } from '../store/appSlice';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 24;

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#1A3FB8',
  primaryDark:   '#0D2F8F',
  primaryCircle: '#1C3FAA',
  primaryLight:  '#E8EEF9',
  bg:            '#F2F4F8',
  surface:       '#FFFFFF',
  textPrimary:   '#0D1B2A',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  border:        '#E2E6EF',
  borderActive:  '#1A3FB8',
  success:       '#22C55E',
};

// ─── Logo Grid (2×2 squares inside circle) ─────────────────────────────────────
const LogoIcon = () => (
  <View
    style={styles.logoCircle}
    accessibilityRole="image"
    accessibilityLabel="Parcela logo"
  >
    <View style={styles.logoGrid}>
      <View style={styles.logoRow}>
        <View style={styles.logoSquare} />
        <View style={styles.logoSquare} />
      </View>
      <View style={styles.logoRow}>
        <View style={styles.logoSquare} />
        <View style={styles.logoSquare} />
      </View>
    </View>
  </View>
);

// ─── Language Card ─────────────────────────────────────────────────────────────
const LanguageCard = ({ code, flag, label, isSelected, onPress, disabled }) => (
  <TouchableOpacity
    style={[
      styles.langCard,
      isSelected && styles.langCardSelected,
      disabled && styles.langCardDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={`${label} language option`}
    accessibilityHint={`Select ${label} as your language`}
    accessibilityState={{ selected: isSelected }}
  >
    {/* Flag */}
    <Text style={styles.langFlag}>{flag}</Text>

    {/* Label */}
    <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
      {label}
    </Text>

    {/* Checkmark badge */}
    {isSelected && (
      <View style={styles.checkBadge}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── Primary CTA Button ────────────────────────────────────────────────────────
const PrimaryButton = ({ label, icon, onPress, disabled, loading }) => (
  <TouchableOpacity
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.88}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint="Proceed to the next step"
    accessibilityState={{ disabled }}
  >
    {loading ? (
      <ActivityIndicator color={C.textOnPrimary} />
    ) : (
      <Text style={styles.buttonLabel}>
        {label}
        {icon ? `  ${icon}` : ''}
      </Text>
    )}
  </TouchableOpacity>
);

// ─── Languages Config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'en', flag: '🇬🇧', label: 'English'   },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SplashScreen = () => {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const { t }     = useTranslation();
  const language  = useSelector((state) => state.app.language);

  const handleLanguageSelect = useCallback((code) => {
    dispatch(setLanguagePersisted(code));
  }, [dispatch]);

  const handleStart = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleTerms = useCallback(() => {
    Linking.openURL('https://parcela.cv/termos').catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          <LogoIcon />
          <Text style={styles.title} accessibilityRole="header">
            {t('splash.title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('splash.subtitle')}
          </Text>
        </View>

        {/* ── Language Selection ── */}
        <View style={styles.langSection}>
          <Text style={styles.langLabel_heading}>
            {t('splash.selectLanguage')}
          </Text>

          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              code={lang.code}
              flag={lang.flag}
              label={lang.label}
              isSelected={language === lang.code}
              onPress={() => handleLanguageSelect(lang.code)}
            />
          ))}
        </View>

        {/* ── CTA Button ── */}
        <View style={styles.ctaSection}>
          <PrimaryButton
            label={t('splash.start')}
            icon="→"
            onPress={handleStart}
          />

          {/* Footer Terms */}
          <Text style={styles.termsText}>
            {t('splash.termsText')}
            <Text
              style={styles.termsLink}
              onPress={handleTerms}
              accessibilityRole="link"
              accessibilityLabel="Termos de Uso"
              accessibilityHint="Open Terms of Use in browser"
            >
              {t('splash.termsLink')}
            </Text>
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: H_PAD,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // ── Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primaryCircle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // Shadow iOS
    shadowColor: C.primaryCircle,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Android
    elevation: 10,
  },
  logoGrid: {
    gap: 6,
  },
  logoRow: {
    flexDirection: 'row',
    gap: 6,
  },
  logoSquare: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    opacity: 0.95,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: SCREEN_W - H_PAD * 2,
  },

  // ── Language section
  langSection: {
    marginBottom: 28,
  },
  langLabel_heading: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  // ── Language Card
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    minHeight: 58,
    // Shadow iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // Android
    elevation: 2,
  },
  langCardSelected: {
    borderColor: C.borderActive,
    backgroundColor: C.surface,
  },
  langCardDisabled: {
    opacity: 0.5,
  },
  langFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  langLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: C.textPrimary,
    letterSpacing: 0.1,
  },
  langLabelSelected: {
    fontWeight: '600',
    color: C.textPrimary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── CTA Button
  ctaSection: {
    marginTop: 'auto',
  },
  button: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // Shadow iOS
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    // Android
    elevation: 6,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonLabel: {
    color: C.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Footer Terms
  termsText: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: C.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SplashScreen;
