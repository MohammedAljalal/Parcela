import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  Dimensions,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { submitOrder } from '../src/store/slices/ordersSlice';
import { resetCart } from '../src/store/slices/cartSlice';
import { fetchAddresses } from '../src/store/slices/addressSlice';
import toast from '../src/utils/toast';
import apiClient from '../src/api/client';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     '#0D47A1',
  primaryDark: '#0A2E78',
  yellow:      '#FFC107',
  bg:          '#F5F7FA',
  surface:     '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#777777',
  textMuted:   '#AAAAAA',
  border:      '#E5E5E5',
  danger:      '#EF4444',
  success:     '#22C55E',
};

const formatCVE = (v) => {
  if (v == null) return '0$00';
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '$00';
};

const getItemName = (item) => {
  const p = item?.product;
  if (!p) return item?.name ?? 'Produto';
  return p?.name?.pt || p?.name?.en || (typeof p?.name === 'string' ? p.name : 'Produto');
};

const getItemImage = (item) => {
  const p = item?.product;
  const imgs = p?.images ?? item?.images ?? [];
  if (!imgs.length) return null;
  const img = imgs[0];
  return typeof img === 'string' ? img : (img.url ?? img.secure_url ?? null);
};

const getInitials = (user) => {
  const name = user?.name || user?.email || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.slice(0, 2) || 'SA').toUpperCase();
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();

  const user     = useSelector((s) => s.auth.user);
  const { items, subtotal, deliveryFee, total, deliveryIsland } = useSelector((s) => s.cart);
  const { submitting } = useSelector((s) => s.orders);

  // Use Redux slice for addresses (guaranteed array from initialState)
  const { list: addresses, loading: loadingAddresses, defaultAddress } = useSelector((s) => s.addresses);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [islands, setIslands] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState(deliveryIsland ?? null);
  const [loadingIslands, setLoadingIslands] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const loadingData = loadingAddresses || loadingIslands;

  const initials = getInitials(user);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Dispatch Redux thunk for addresses
    dispatch(fetchAddresses());

    // Fetch islands directly
    let cancelled = false;
    import('../src/api/islands').then(({ getIslands }) => {
      getIslands()
        .then((res) => {
          if (cancelled) return;
          const isls = Array.isArray(res.data?.data?.islands)
            ? res.data.data.islands
            : (Array.isArray(res.data?.islands) ? res.data.islands : []);
          setIslands(isls);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoadingIslands(false); });
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch addresses every time this screen comes into focus
  // (e.g. after returning from add-address screen)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchAddresses());
    }, [dispatch])
  );

  // Pre-select default address once Redux loads
  useEffect(() => {
    if (!selectedAddress && defaultAddress) {
      setSelectedAddress(defaultAddress);
    } else if (!selectedAddress && addresses.length > 0) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, defaultAddress]);

  // Auto-select first island if none selected
  useEffect(() => {
    if (!selectedIsland && islands.length > 0) {
      setSelectedIsland(islands[0]);
    }
  }, [islands]);

  // ── Confirm Order ─────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!selectedAddress) {
      toast.error('Adiciona um endereço de entrega primeiro.', 'Endereço obrigatório');
      // Navigate directly to add-address screen
      setTimeout(() => router.push('/add-address'), 600);
      return;
    }
    if (!selectedIsland) {
      toast.error('Por favor seleciona a ilha de entrega.', 'Ilha obrigatória');
      return;
    }

    try {
      const orderData = await dispatch(submitOrder({
        addressId: selectedAddress._id,
        islandId: selectedIsland._id,
        paymentMethod: paymentMethod === 'card' ? 'card' : 'cash_on_delivery',
      })).unwrap();

      if (paymentMethod === 'card') {
        // Fetch checkout session from backend
        const intentRes = await apiClient.post('/stripe/checkout', { orderId: orderData.order._id });
        const { url } = intentRes.data.data;
        
        // Open the Stripe hosted checkout page
        await Linking.openURL(url);
      }

      // Clear cart state after successful order
      dispatch(resetCart());

      toast.success('A tua encomenda foi criada com sucesso.', '✓ Confirmada!');
      setTimeout(() => {
        router.replace('/(tabs)/orders');
      }, 1500);
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message ?? 'Falha ao criar encomenda. Tente novamente.');
      toast.error(msg, 'Erro no Pagamento');
    }
  }, [dispatch, router, selectedAddress, selectedIsland]);

  if (loadingData) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const effectiveDeliveryFee = selectedIsland?.deliveryFee ?? deliveryFee ?? 0;
  const effectiveTotal = subtotal + effectiveDeliveryFee;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')} 
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parcela</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Finalizar Pedido</Text>
        <Text style={styles.pageSubtitle}>Confirme os detalhes da sua entrega e pagamento.</Text>

        {/* ── Delivery Address ──────────────────────────────────────────────── */}
        <SectionTitle title="Endereço de Entrega" icon="location-outline" />

        {addresses.length === 0 ? (
          <View style={styles.emptyAddressCard}>
            <Ionicons name="home-outline" size={24} color={C.textMuted} />
            <Text style={styles.emptyAddressText}>Nenhum endereço guardado</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <TouchableOpacity
              key={addr._id}
              style={[
                styles.addressCard,
                selectedAddress?._id === addr._id && styles.addressCardSelected,
              ]}
              onPress={() => setSelectedAddress(addr)}
              activeOpacity={0.7}
            >
              {addr.isDefault && (
                <Text style={styles.addressDefaultTag}>MORADA PRINCIPAL</Text>
              )}
              <Text style={styles.addressLine}>{addr.address}</Text>
              <Text style={styles.addressCity}>{addr.city}, Ilha de {addr.island?.name ?? ''}</Text>
              {selectedAddress?._id === addr._id && (
                <View style={styles.addressCheck}>
                  <Ionicons name="checkmark-circle" size={22} color={C.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* New address button */}
        <TouchableOpacity style={styles.newAddressBtn} activeOpacity={0.7} onPress={() => router.push('/add-address')}>
          <Ionicons name="add-circle-outline" size={18} color={C.primary} />
          <Text style={styles.newAddressBtnText}>Nova Morada</Text>
        </TouchableOpacity>

        {/* ── Choose Island ─────────────────────────────────────────────────── */}
        <SectionTitle title="Escolher Ilha" icon="earth-outline" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.islandsScroll}
        >
          {islands.map((island) => {
            const isSelected = selectedIsland?._id === island._id;
            return (
              <TouchableOpacity
                key={island._id}
                style={[styles.islandChip, isSelected && styles.islandChipSelected]}
                onPress={() => setSelectedIsland(island)}
                activeOpacity={0.75}
              >
                <Text style={[styles.islandCode, isSelected && styles.islandCodeSelected]}>
                  {island.code}
                </Text>
                <Text style={[styles.islandName, isSelected && styles.islandNameSelected]} numberOfLines={1} adjustsFontSizeToFit>
                  {island.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Order Summary ─────────────────────────────────────────────────── */}
        <SectionTitle title="Resumo do Pedido" icon="receipt-outline" />

        <View style={styles.summaryCard}>
          {items.map((item, i) => {
            const imgUrl = getItemImage(item);
            const name   = getItemName(item);
            const price  = item.price ?? item.product?.price ?? 0;
            const qty    = item.quantity ?? 1;

            return (
              <View key={i} style={[styles.summaryItem, i > 0 && styles.summaryItemBorder]}>
                <View style={styles.summaryItemImg}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.summaryImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.summaryImgPlaceholder}>
                      <Ionicons name="image-outline" size={16} color={C.textMuted} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryItemName} numberOfLines={2}>{name}</Text>
                  <Text style={styles.summaryItemQty}>Qtd: {qty}</Text>
                </View>
                <Text style={styles.summaryItemPrice}>{formatCVE(price * qty)}</Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCVE(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxa de Entrega</Text>
            <Text style={[styles.totalValue, effectiveDeliveryFee === 0 && { color: C.success }]}>
              {effectiveDeliveryFee === 0 ? 'Grátis' : formatCVE(effectiveDeliveryFee)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCVE(effectiveTotal)}</Text>
          </View>
        </View>

        {/* ── Payment Method ────────────────────────────────────────────────── */}
        <SectionTitle title="Método de Pagamento" icon="card-outline" />

        <View style={styles.paymentContainer}>
          {/* Card Option */}
          <TouchableOpacity 
            style={[styles.paymentCard, paymentMethod === 'card' && styles.paymentCardSelected]} 
            activeOpacity={0.8}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={[styles.paymentIconWrap, paymentMethod === 'card' && styles.paymentIconWrapSelected]}>
              <MaterialCommunityIcons name="credit-card-outline" size={22} color={paymentMethod === 'card' ? '#FFF' : C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Cartão de Crédito</Text>
              <Text style={styles.paymentSubtitle}>Pague agora com segurança</Text>
            </View>
            {paymentMethod === 'card' && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
          </TouchableOpacity>

          {/* Cash Option */}
          <TouchableOpacity 
            style={[styles.paymentCard, paymentMethod === 'cash' && styles.paymentCardSelected]} 
            activeOpacity={0.8}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={[styles.paymentIconWrap, paymentMethod === 'cash' && styles.paymentIconWrapSelected]}>
              <MaterialCommunityIcons name="cash" size={22} color={paymentMethod === 'cash' ? '#FFF' : C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Pagamento na Entrega</Text>
              <Text style={styles.paymentSubtitle}>Pague em dinheiro ao receber</Text>
            </View>
            {paymentMethod === 'cash' && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
          </TouchableOpacity>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Confirm Button ────────────────────────────────────────────────────── */}
      <View style={styles.confirmBar}>
        {!selectedAddress && (
          <View style={styles.noAddressHint}>
            <Ionicons name="information-circle-outline" size={14} color="#F59E0B" />
            <Text style={styles.noAddressHintText}>
              Adiciona um endereço de entrega para continuar
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && { opacity: 0.75 }]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirmar Pedido</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-component: Section Title ─────────────────────────────────────────────
function SectionTitle({ title, icon }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loadingFull: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  headerTitle: {
    fontSize: 18, fontWeight: '800', color: C.primary,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Page title
  pageTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginTop: 8, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 20 },

  // Section title
  sectionTitleRow: { marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },

  // Address
  addressCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: C.border,
    position: 'relative',
  },
  addressCardSelected: {
    borderColor: C.primary,
    backgroundColor: '#EEF3FC',
  },
  addressDefaultTag: {
    fontSize: 10, fontWeight: '700', color: C.textMuted,
    letterSpacing: 0.5, marginBottom: 6,
  },
  addressLine: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  addressCity: { fontSize: 13, color: C.textSecondary },
  addressCheck: { position: 'absolute', top: 14, right: 14 },
  emptyAddressCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  emptyAddressText: { fontSize: 14, color: C.textMuted },
  newAddressBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 4,
  },
  newAddressBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },

  // Island chips
  islandsScroll: { gap: 8, paddingBottom: 4 },
  islandChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.surface,
    minWidth: 60,
  },
  islandChipSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  islandCode: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  islandCodeSelected: { color: '#FFF' },
  islandName: { fontSize: 10, color: C.textSecondary, marginTop: 2 },
  islandNameSelected: { color: 'rgba(255,255,255,0.8)' },

  // Summary card
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryItemBorder: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  summaryItemImg: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F4FA' },
  summaryImg: { width: '100%', height: '100%' },
  summaryImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryItemName: { fontSize: 13, fontWeight: '600', color: C.textPrimary, lineHeight: 18 },
  summaryItemQty: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  summaryItemPrice: { fontSize: 14, fontWeight: '700', color: C.primary },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: C.textSecondary },
  totalValue: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 4 },
  grandTotalLabel: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  grandTotalValue: { fontSize: 17, fontWeight: '800', color: C.primary },

  // Payment
  paymentContainer: { gap: 10 },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface,
    borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: C.border,
  },
  paymentCardSelected: {
    borderColor: C.primary,
  },
  paymentIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#EEF3FC',
    alignItems: 'center', justifyContent: 'center',
  },
  paymentIconWrapSelected: {
    backgroundColor: C.primary,
  },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  paymentSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // Confirm button
  confirmBar: {
    paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 28,
    backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 8,
  },
  noAddressHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  noAddressHintText: { fontSize: 12, color: '#92400E', flex: 1 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.primary,
    borderRadius: 14, height: 52,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
