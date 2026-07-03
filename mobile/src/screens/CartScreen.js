import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  fetchCart,
  updateItem,
  removeItem,
  setIsland,
} from '../store/slices/cartSlice';
import { getIslands } from '../api/islands';
import { previewCoupon } from '../api/coupons';
import toast from '../utils/toast';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#0D47A1',
  yellow:        '#FFC107',
  bg:            '#F5F7FA',
  surface:       '#FFFFFF',
  textPrimary:   '#1A1A1A',
  textSecondary: '#777777',
  textMuted:     '#AAAAAA',
  border:        '#E5E5E5',
  danger:        '#EF4444',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const getItemPrice = (item) =>
  item?.price ?? item?.product?.price ?? 0;

const getItemProductId = (item) =>
  item?.product?._id ?? item?.productId ?? item?._id;

// ─── Cart Item Card ───────────────────────────────────────────────────────────
const CartItemCard = React.memo(({ item, onUpdateQty, onRemove, isUpdating }) => {
  const name    = getItemName(item);
  const imgUrl  = getItemImage(item);
  const price   = getItemPrice(item);
  const qty     = item.quantity ?? 1;
  const productId = getItemProductId(item);

  return (
    <View style={styles.itemCard}>
      {/* Product Image */}
      <View style={styles.itemImgWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.itemImg} resizeMode="cover" />
        ) : (
          <View style={styles.itemImgPlaceholder}>
            <Ionicons name="image-outline" size={24} color={C.textMuted} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
        <Text style={styles.itemPrice}>{formatCVE(price)}</Text>

        {/* Quantity controls */}
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={[styles.qtyBtn, isUpdating && styles.qtyBtnDisabled]}
            onPress={() => {
              if (qty <= 1) {
                onRemove(productId, name);
              } else {
                onUpdateQty(productId, qty - 1);
              }
            }}
            disabled={isUpdating}
          >
            {qty <= 1 ? (
              <Ionicons name="trash-outline" size={18} color={C.danger} />
            ) : (
              <Text style={styles.qtyBtnText}>−</Text>
            )}
          </TouchableOpacity>

          <View style={styles.qtyValueWrap}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Text style={styles.qtyValue}>{qty}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.qtyBtn, isUpdating && styles.qtyBtnDisabled]}
            onPress={() => onUpdateQty(productId, qty + 1)}
            disabled={isUpdating}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onRemove(productId, name)}
        disabled={isUpdating}
      >
        <Ionicons name="trash-outline" size={20} color={C.danger} />
      </TouchableOpacity>
    </View>
  );
});

CartItemCard.displayName = 'CartItemCard';

// ─── Island Picker Modal ──────────────────────────────────────────────────────
function IslandPickerModal({ visible, islands, selectedId, onSelect, onClose, loading }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{t('cart.deliveryIsland')}</Text>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 24 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {islands.map((island) => (
              <TouchableOpacity
                key={island._id}
                style={[
                  styles.islandOption,
                  island._id === selectedId && styles.islandOptionSelected,
                ]}
                onPress={() => { onSelect(island); onClose(); }}
              >
                <View style={styles.islandCodeBadge}>
                  <Text style={styles.islandCode}>{island.code}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.islandName}>{island.name}</Text>
                  {island.capital && (
                    <Text style={styles.islandCapital}>{island.capital}</Text>
                  )}
                </View>
                <Text style={styles.islandFee}>
                  {island.deliveryFee === 0 ? t('cart.free') : formatCVE(island.deliveryFee)}
                </Text>
                {island._id === selectedId && (
                  <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={styles.modalCloseBtnText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CartScreen() {
  const dispatch = useDispatch();
  const cartNav  = useRouter();
  const { t } = useTranslation();

  const {
    items,
    itemCount,
    subtotal,
    deliveryIsland,
    deliveryFee,
    total,
    loading,
    updatingItems,
    error,
  } = useSelector((s) => s.cart);

  const [islandModalVisible, setIslandModalVisible] = useState(false);
  const [islands, setIslands] = useState([]);
  const [islandsLoading, setIslandsLoading] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null); // { discount, discountType, finalTotal, message }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // ── Fetch cart on mount ──────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await dispatch(fetchCart()); }
    finally { setRefreshing(false); }
  }, [dispatch]);

  // ── Fetch islands (lazy, when modal opens) ────────────────────────────────
  const handleOpenIslandModal = useCallback(async () => {
    setIslandModalVisible(true);
    if (islands.length) return;
    setIslandsLoading(true);
    try {
      const res = await getIslands();
      setIslands(res.data?.data?.islands ?? res.data?.islands ?? []);
    } catch (err) {
      toast.error('Falha ao carregar ilhas');
    } finally {
      setIslandsLoading(false);
    }
  }, [islands.length]);

  const handleSelectIsland = useCallback((island) => {
    dispatch(setIsland({ islandId: island._id }));
  }, [dispatch]);

  const handleUpdateQty = useCallback((productId, newQty) => {
    if (newQty < 1) return;
    dispatch(updateItem({ productId, quantity: newQty }));
  }, [dispatch]);

  // Coupon apply handler
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponData(null);
    try {
      const res = await previewCoupon(couponCode.trim());
      const data = res.data?.data ?? res.data;
      setCouponData(data);
      toast.success(t('cart.couponApplied'));
    } catch (err) {
      const msg = err.response?.data?.message || t('cart.couponInvalid');
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponCode('');
    setCouponData(null);
    setCouponError(null);
  }, []);


  const handleRemove = useCallback(async (productId, name) => {
    try {
      await dispatch(removeItem({ productId })).unwrap();
      toast.info(`"${name}" ${t('cart.itemRemoved')}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('cart.errorRemove'));
    }
  }, [dispatch]);

  const handleCheckout = useCallback(() => {
    if (!items.length) return;
    cartNav.push('/checkout');
  }, [cartNav, items.length]);

  // ── Empty Cart ───────────────────────────────────────────────────────────
  if (!loading && !error && items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            {cartNav.canGoBack() ? (
              <TouchableOpacity onPress={() => cartNav.back()} style={{ marginRight: 8 }}>
                <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name="view-grid" size={18} color={C.primary} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.brand}>Parcela</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={72} color={C.border} />
          <Text style={styles.emptyTitle}>{t('cart.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('cart.emptySubtitle')}</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => cartNav.replace('/(tabs)/home')}>
            <Text style={styles.shopBtnText}>{t('cart.explore')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const islandLabel = deliveryIsland
    ? `${deliveryIsland.name}${deliveryIsland.capital ? ` (${deliveryIsland.capital})` : ''}`
    : t('cart.selectIsland');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          {cartNav.canGoBack() ? (
            <TouchableOpacity onPress={() => cartNav.back()} style={{ marginRight: 8 }}>
              <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
            </TouchableOpacity>
          ) : (
            <MaterialCommunityIcons name="view-grid" size={18} color={C.primary} style={{ marginRight: 8 }} />
          )}
          <Text style={styles.brand}>Parcela</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => getItemProductId(item) ?? String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.screenTitle}>{t('cart.title')}</Text>
            <Text style={styles.screenSubtitle}>
              {t(itemCount === 1 ? 'cart.subtitle_one' : 'cart.subtitle_other', { count: itemCount })}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pid = getItemProductId(item);
          return (
            <CartItemCard
              item={item}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemove}
              isUpdating={!!updatingItems[pid]}
            />
          );
        }}
        ListFooterComponent={
          <View>
            {/* ── Island Selector ────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>{t('cart.deliveryIsland')}</Text>
            <TouchableOpacity
              style={styles.islandSelector}
              onPress={handleOpenIslandModal}
              activeOpacity={0.7}
            >
              <Text style={[styles.islandSelectorText, !deliveryIsland && { color: C.textMuted }]}>
                {islandLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
            </TouchableOpacity>

            {/* ── Coupon Code ─────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>{t('cart.discountCode')}</Text>
            {couponData ? (
              <View style={styles.couponApplied}>
                <Ionicons name="pricetag" size={16} color="#22C55E" />
                <Text style={styles.couponAppliedText}>
                  {couponCode.toUpperCase()} — {couponData.message || t('cart.couponApplied')}
                </Text>
                <TouchableOpacity onPress={handleRemoveCoupon} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder={t('cart.enterCode')}
                  placeholderTextColor="#AAAAAA"
                  value={couponCode}
                  onChangeText={(t) => { setCouponCode(t.toUpperCase()); setCouponError(null); }}
                  autoCapitalize="characters"
                  editable={!couponLoading}
                />
                <TouchableOpacity
                  style={[styles.couponApplyBtn, !couponCode.trim() && { opacity: 0.5 }]}
                  onPress={handleApplyCoupon}
                  disabled={!couponCode.trim() || couponLoading}
                  activeOpacity={0.8}
                >
                  {couponLoading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={styles.couponApplyBtnText}>{t('cart.apply')}</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
            {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}

            {/* ── Summary ────────────────────────────────────────────────── */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('cart.subtotal')}</Text>
                <Text style={styles.summaryValue}>{formatCVE(subtotal)}</Text>
              </View>
              {couponData?.discount ? (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#22C55E' }]}>{t('cart.discountCode')} ({couponCode})</Text>
                  <Text style={[styles.summaryValue, { color: '#22C55E' }]}>-{formatCVE(couponData.discount)}</Text>
                </View>
              ) : null}
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelRow}>
                  <Text style={styles.summaryLabel}>{t('cart.delivery')}</Text>
                  {!deliveryIsland && (
                    <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
                  )}
                </View>
                <Text style={styles.summaryValue}>
                  {deliveryIsland
                    ? deliveryFee === 0 ? t('cart.free') : formatCVE(deliveryFee)
                    : '—'}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>{t('cart.total')}</Text>
                <Text style={styles.totalValue}>{formatCVE(total)}</Text>
              </View>
            </View>

            {/* Spacer for button */}
            <View style={{ height: 90 }} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : null
        }
      />

      {items.length > 0 && !loading && (
          <View style={styles.checkoutBox}>
            <TouchableOpacity
              style={[styles.checkoutBtn, islandsLoading && { opacity: 0.8 }]}
              onPress={handleCheckout}
              disabled={islandsLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutBtnText}>{t('cart.checkout')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      {/* ── Island Picker Modal ──────────────────────────────────────────────── */}
      <IslandPickerModal
        visible={islandModalVisible}
        islands={islands}
        selectedId={deliveryIsland?._id}
        onSelect={handleSelectIsland}
        onClose={() => setIslandModalVisible(false)}
        loading={islandsLoading}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },

  // Title
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 16,
  },

  // Cart Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImgWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F4FA',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemImgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    lineHeight: 19,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: C.textPrimary,
    lineHeight: 22,
  },
  qtyValueWrap: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Island selector
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 10,
    marginTop: 8,
  },
  islandSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  islandSelectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textPrimary,
  },

  // Summary
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: C.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },

  // Checkout button
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.yellow,
    borderRadius: 14,
    height: 52,
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
  },

  // Empty / Loading
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  shopBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.textSecondary,
  },

  // Island Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 12,
  },
  islandOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  islandOptionSelected: {
    backgroundColor: '#EEF3FC',
    marginHorizontal: -4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  islandCodeBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  islandName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  islandCapital: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  islandFee: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
    marginRight: 4,
  },
  modalCloseBtn: {
    marginTop: 16,
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  // ── Coupon ───────────────────────────────────────────────────────────────
  couponRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  couponInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F0F4FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.border,
    letterSpacing: 1.2,
  },
  couponApplyBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  couponApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  couponAppliedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  couponError: {
    fontSize: 12,
    color: C.danger,
    marginBottom: 8,
    marginLeft: 2,
  },
});
