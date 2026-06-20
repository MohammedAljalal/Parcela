import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import { setLanguage } from '../store/appSlice';
import Button from '../components/Button';
import LanguageCard from '../components/LanguageCard';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

// ─── Language options config ───────────────────────────────────────────────
const LANGUAGES = [
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

// ─── Logo grid icon (4 rounded squares) ────────────────────────────────────
const LogoIcon = () => (
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
);

// ─── Main Screen ────────────────────────────────────────────────────────────
const SplashScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const language = useSelector((state) => state.app.language);

  const handleLanguageSelect = (code) => {
    dispatch(setLanguage(code));
  };

  const handleStart = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero section ── */}
        <View style={styles.heroSection}>
          {/* Blue circle with logo grid */}
          <View style={styles.logoCircle}>
            <LogoIcon />
          </View>

          {/* Title */}
          <Text style={styles.title}>Bem-vindo à Parcela</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Sua encomenda das ilhas para o{'\n'}mundo com rapidez e segurança.
          </Text>
        </View>

        {/* ── Language section ── */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionLabel}>SELECIONE O IDIOMA</Text>

          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              flag={lang.flag}
              label={lang.label}
              isActive={language === lang.code}
              onPress={() => handleLanguageSelect(lang.code)}
            />
          ))}
        </View>

        {/* ── CTA button ── */}
        <View style={styles.buttonSection}>
          <Button label="Começar" icon="→" onPress={handleStart} />

          <Text style={styles.termsText}>
            Ao continuar, você aceita nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso.</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPaddingH,
    paddingBottom: spacing.xl,
  },

  // ── Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxxl,
  },
  logoCircle: {
    width: spacing.logoCircle,
    height: spacing.logoCircle,
    borderRadius: spacing.logoCircle / 2,
    backgroundColor: colors.primaryCircle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    // Shadow
    shadowColor: colors.shadowPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  // 2×2 grid of rounded squares inside the circle
  logoGrid: {
    gap: 5,
  },
  logoRow: {
    flexDirection: 'row',
    gap: 5,
  },
  logoSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Language
  languageSection: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // ── Button
  buttonSection: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  termsText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default SplashScreen;
