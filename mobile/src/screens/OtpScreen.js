import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { verifyOtp, sendOtp, clearError } from '../store/slices/authSlice';
import toast from '../utils/toast';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#0D47A1',
  primaryDark:   '#0A2E78',
  bg:            '#F5F5F5',
  surface:       '#FFFFFF',
  textPrimary:   '#1A1A1A',
  textSecondary: '#777777',
  textMuted:     '#AAAAAA',
  border:        '#E5E5E5',
  danger:        '#EF4444',
  success:       '#22C55E',
};

const CODE_LENGTH = 6;

// ─── OTP Screen ───────────────────────────────────────────────────────────────
export default function OtpScreen() {
  const router     = useRouter();
  const dispatch   = useDispatch();
  const { t }      = useTranslation();
  const { phone, prefilledName }  = useLocalSearchParams();

  const { loading, loadingOtp, error } = useSelector((state) => state.auth);

  // 6 individual digit refs for auto-focus
  const inputs     = useRef([]);
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [resendSecs, setResendSecs] = useState(60);
  const [sent, setSent] = useState(false); // success flash
  const [name, setName] = useState(prefilledName || '');
  const [needsName, setNeedsName] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  useEffect(() => {
    dispatch(clearError());
    return () => dispatch(clearError());
  }, [dispatch]);

  // ── Digit input handlers ────────────────────────────────────────────────────
  const handleDigit = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit filled
    if (digit && index === CODE_LENGTH - 1) {
      const full = [...next].join('');
      if (full.length === CODE_LENGTH) {
        Keyboard.dismiss();
        handleVerify(full);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // ── Verify ──────────────────────────────────────────────────────────────────
  const handleVerify = (overrideCode) => {
    const finalCode = (overrideCode ?? code.join(''));
    if (finalCode.length < CODE_LENGTH) return;

    dispatch(verifyOtp({ phone, code: finalCode, name: name.trim() || undefined }))
      .unwrap()
      .then(() => toast.success('Número verificado com sucesso!', 'Bem-vindo'))
      .catch((err) => {
        if (err === 'Name is required to complete account creation') {
          setNeedsName(true);
        } else {
          // Clear the code boxes on wrong code
          setCode(Array(CODE_LENGTH).fill(''));
          inputs.current[0]?.focus();
          toast.error(typeof err === 'string' ? err : 'Código incorreto');
        }
      });
  };

  // ── Resend ──────────────────────────────────────────────────────────────────
  const handleResend = () => {
    if (resendSecs > 0 || loadingOtp) return;
    dispatch(sendOtp(phone))
      .unwrap()
      .then(() => {
        setCode(Array(CODE_LENGTH).fill(''));
        setResendSecs(60);
        toast.info('Código reenviado com sucesso!');
        inputs.current[0]?.focus();
      })
      .catch((err) => {
        toast.error(typeof err === 'string' ? err : 'Falha ao reenviar código');
      });
  };

  const fullCode = code.join('');
  const isComplete = fullCode.length === CODE_LENGTH;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Back button ── */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>

        <View style={styles.body}>
          {/* ── Icon ── */}
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={32} color={C.primary} />
          </View>

          {/* ── Title ── */}
          <Text style={styles.title}>{t('otp.title')}</Text>
          <Text style={styles.subtitle}>
            {t('otp.subtitle')}{'\n'}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>

          {/* ── Code boxes ── */}
          <View style={styles.codeRow}>
            {Array(CODE_LENGTH).fill(0).map((_, i) => (
              <TextInput
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                style={[
                  styles.codeBox,
                  code[i] ? styles.codeBoxFilled : null,
                  error && styles.codeBoxError,
                ]}
                value={code[i]}
                onChangeText={(t) => handleDigit(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          {/* ── Name Input for New Users ── */}
          {needsName ? (
            <View style={styles.nameInputContainer}>
              <Text style={styles.nameInputLabel}>Parece que é novo por aqui! Qual é o seu nome?</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Introduza o seu nome completo"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          ) : null}

          {/* ── Error ── */}
          {error && error !== 'Name is required to complete account creation' ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Success flash ── */}
          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color={C.success} />
              <Text style={styles.successText}>Código reenviado com sucesso!</Text>
            </View>
          ) : null}

          {/* ── Verify button ── */}
          <TouchableOpacity
            style={[styles.verifyBtn, (!isComplete || loading || (needsName && !name.trim())) && styles.verifyBtnDisabled]}
            onPress={() => handleVerify()}
            disabled={!isComplete || loading || (needsName && !name.trim())}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.verifyBtnText}>{t('otp.verify')}</Text>
            )}
          </TouchableOpacity>

          {/* ── Resend ── */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Não recebeu o código? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendSecs > 0 || loadingOtp}
            >
              {loadingOtp ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : resendSecs > 0 ? (
                <Text style={styles.resendTimer}>Reenviar em {resendSecs}s</Text>
              ) : (
                <Text style={styles.resendLink}>Reenviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  backBtn: {
    padding: 16,
    paddingBottom: 0,
    alignSelf: 'flex-start',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // ── Icon circle
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  // ── Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: C.primary,
  },

  // ── Code boxes
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  codeBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  codeBoxFilled: {
    borderColor: C.primary,
    backgroundColor: '#EEF3FB',
  },
  codeBoxError: {
    borderColor: C.danger,
    backgroundColor: '#FEF2F2',
  },

  // ── Name Input
  nameInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  nameInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.textPrimary,
  },

  // ── Error / Success
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: C.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  successText: {
    color: C.success,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // ── Verify button
  verifyBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Resend
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLabel: {
    fontSize: 14,
    color: C.textSecondary,
  },
  resendTimer: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    color: C.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
