import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

// Called when Stripe redirects back to parcela://payment-result?status=success|cancel
export default function PaymentResultScreen() {
  const router = useRouter();
  const { status, orderId } = useLocalSearchParams<{ status: string; orderId: string }>();

  // Dismiss any lingering in-app browser session
  useEffect(() => {
    WebBrowser.dismissBrowser?.();
  }, []);

  const isSuccess = status === 'success';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>

        {/* Icon */}
        <View style={[styles.iconWrap, isSuccess ? styles.iconSuccess : styles.iconError]}>
          <Ionicons
            name={isSuccess ? 'checkmark-circle' : 'close-circle'}
            size={80}
            color={isSuccess ? '#22C55E' : '#EF4444'}
          />
        </View>

        {/* Message */}
        <Text style={styles.title}>
          {isSuccess ? 'Pagamento Confirmado!' : 'Pagamento Cancelado'}
        </Text>
        <Text style={styles.subtitle}>
          {isSuccess
            ? 'O teu pedido foi pago com sucesso e está em processamento.'
            : 'O pagamento foi cancelado. O teu pedido ficou guardado.'}
        </Text>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/orders')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Ver Pedidos</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        {!isSuccess && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Continuar a Comprar</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconSuccess: { backgroundColor: '#DCFCE7' },
  iconError:   { backgroundColor: '#FEE2E2' },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D47A1',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryBtnText: { fontSize: 14, color: '#0D47A1', fontWeight: '600' },
});
