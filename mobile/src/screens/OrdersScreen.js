import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchOrders } from '../store/slices/ordersSlice';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     '#0D47A1',
  yellow:      '#FFC107',
  bg:          '#F5F7FA',
  surface:     '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#777777',
  textMuted:   '#AAAAAA',
  border:      '#E5E5E5',
  danger:      '#EF4444',
  success:     '#22C55E',
  warning:     '#F59E0B',
  purple:      '#8B5CF6',
};

// ─── Status Configuration ─────────────────────────────────────────────────────
// We removed the static label fields from STATUS_CONFIG and FILTER_TABS.
// The label will be evaluated dynamically inside the component via t('...')
const STATUS_CONFIG = {
  pending: {
    color: '#FFF3CD',
    textColor: C.warning,
    borderColor: C.warning,
    actionIcon: 'card-outline',
  },
  paid: {
    color: '#EDE9FE',
    textColor: C.purple,
    borderColor: C.purple,
    actionIcon: 'document-text-outline',
  },
  processing: {
    color: '#DBEAFE',
    textColor: C.primary,
    borderColor: C.primary,
    actionIcon: 'information-circle-outline',
  },
  shipped: {
    color: '#DBEAFE',
    textColor: C.primary,
    borderColor: C.primary,
    actionIcon: 'navigate-outline',
  },
  delivered: {
    color: '#D1FAE5',
    textColor: C.success,
    borderColor: C.success,
    actionIcon: 'checkmark-circle-outline',
  },
  cancelled: {
    color: '#FEE2E2',
    textColor: C.danger,
    borderColor: C.danger,
    actionIcon: '',
  },
};

// ─── Filter Tabs Config ───────────────────────────────────────────────────────
const FILTER_TABS = [
  { translationKey: 'orders.all', value: 'all' },
  { translationKey: 'orders.pending', value: 'pending' },
  { translationKey: 'orders.shipped', value: 'shipped' },
  { translationKey: 'orders.delivered', value: 'delivered' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCVE = (v) => {
  if (v == null) return '0$00';
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' CVE';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return `Hoje, ${d.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })}`;
    if (days === 1) return `Ontem, ${d.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('pt', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getFirstItemImage = (order) => {
  const items = order?.items ?? [];
  if (!items.length) return null;
  const item = items[0];
  const imgs = item?.product?.images ?? item?.images ?? [];
  if (!imgs.length) return null;
  const img = imgs[0];
  return typeof img === 'string' ? img : (img.url ?? img.secure_url ?? null);
};

const getFirstItemName = (order) => {
  const items = order?.items ?? [];
  if (!items.length) return 'Encomenda';
  const item = items[0];
  const p = item?.product;
  if (!p) return item?.name ?? 'Produto';
  return p?.name?.pt || p?.name?.en || (typeof p?.name === 'string' ? p.name : 'Produto');
};

const getVendorName = (order) => {
  const items = order?.items ?? [];
  if (!items.length) return '';
  return items[0]?.product?.vendorInfo?.storeName ?? '';
};

const getInitials = (user) => {
  const name = user?.name || user?.email || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.slice(0, 2) || 'SA').toUpperCase();
};

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = React.memo(({ order, onAction }) => {
  const { t } = useTranslation();
  const config   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const imgUrl   = getFirstItemImage(order);
  const itemName = getFirstItemName(order);
  const vendor   = getVendorName(order);

  // Derive localized labels inside component
  let localizedStatusLabel = '';
  let localizedActionLabel = '';
  
  if (order.status === 'pending') { localizedStatusLabel = t('orders.pending'); localizedActionLabel = 'Pagar Agora'; } // Using static actions for now if no translation was setup for them, but statuses are translated
  else if (order.status === 'paid') { localizedStatusLabel = 'Pago'; localizedActionLabel = 'Recibo'; }
  else if (order.status === 'processing') { localizedStatusLabel = 'Em Processo'; localizedActionLabel = 'Detalhes'; }
  else if (order.status === 'shipped') { localizedStatusLabel = t('orders.shipped'); localizedActionLabel = 'Rastrear'; }
  else if (order.status === 'delivered') { localizedStatusLabel = t('orders.delivered'); localizedActionLabel = 'Detalhes'; }
  else if (order.status === 'cancelled') { localizedStatusLabel = 'Cancelado'; }

  const hasAction = !!localizedActionLabel;

  return (
    <View style={styles.orderCard}>
      {/* Top row: ID + Date + Status badge */}
      <View style={styles.orderCardHeader}>
        <View>
          <Text style={styles.orderId}>ID #{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color, borderColor: config.borderColor }]}>
          <Text style={[styles.statusText, { color: config.textColor }]}>{localizedStatusLabel}</Text>
        </View>
      </View>

      {/* Product preview */}
      <View style={styles.orderProductRow}>
        <View style={styles.orderImgWrap}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.orderImg} resizeMode="cover" />
          ) : (
            <View style={styles.orderImgPlaceholder}>
              <Ionicons name="image-outline" size={20} color={C.textMuted} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderItemName} numberOfLines={2}>{itemName}</Text>
          {!!vendor && (
            <Text style={styles.orderVendor}>Vendido por {vendor}</Text>
          )}
        </View>
      </View>

      {/* Bottom row: Total + Action */}
      <View style={styles.orderCardFooter}>
        <Text style={styles.orderTotal}>{formatCVE(order.total)}</Text>
        {hasAction && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onAction(order)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: config.textColor }]}>{localizedActionLabel}</Text>
            {config.actionIcon ? (
              <Ionicons name={config.actionIcon} size={14} color={config.textColor} />
            ) : null}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

OrderCard.displayName = 'OrderCard';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { t }    = useTranslation();

  const user     = useSelector((s) => s.auth.user);
  const { orders, stats, loading, error } = useSelector((s) => s.orders);

  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const initials = getInitials(user);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const loadOrders = useCallback((status = 'all') => {
    dispatch(fetchOrders({ status }));
  }, [dispatch]);

  useEffect(() => {
    loadOrders('all');
  }, [loadOrders]);

  const handleFilterChange = useCallback((value) => {
    setActiveFilter(value);
    loadOrders(value);
  }, [loadOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchOrders({ status: activeFilter }));
    setRefreshing(false);
  }, [dispatch, activeFilter]);

  const handleOrderAction = useCallback((order) => {
    // Could navigate to order detail or payment screen
    console.log('[Orders] action on order:', order._id, order.status);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="view-grid" size={18} color={C.primary} />
          <Text style={styles.brand}>Parcela</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id ?? item.orderNumber ?? String(Math.random())}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.primary]} />
        }
        ListHeaderComponent={
          <View>
            {/* Page Title */}
            <Text style={styles.pageTitle}>{t('orders.title')}</Text>
            <Text style={styles.pageSubtitle}>{t('orders.subtitle')}</Text>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('orders.inTransit')}</Text>
                <Text style={styles.statCount}>{String(stats.inTransit ?? 0).padStart(2, '0')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('orders.completed')}</Text>
                <Text style={styles.statCount}>{String(stats.completed ?? 0).padStart(2, '0')}</Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsScroll}
            >
              {FILTER_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[styles.filterTab, activeFilter === tab.value && styles.filterTabActive]}
                  onPress={() => handleFilterChange(tab.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterTabText, activeFilter === tab.value && styles.filterTabTextActive]}>
                    {t(tab.translationKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Loading */}
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            )}

            {/* Error */}
            {!loading && error && (
              <View style={styles.errorBox}>
                <Ionicons name="cloud-offline-outline" size={40} color={C.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders(activeFilter)}>
                  <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onAction={handleOrderAction} />
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={C.border} />
              <Text style={styles.emptyTitle}>{t('orders.noOrders')}</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? t('orders.noOrdersSubtitle')
                  : t('orders.noOrdersSubtitle')}
              </Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => router.replace('/(tabs)/home')}
              >
                <Text style={styles.shopBtnText}>{t('orders.shopNow')}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Header
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 18, fontWeight: '800', color: C.primary },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Page Title
  pageTitle: { fontSize: 24, fontWeight: '800', color: C.textPrimary, marginTop: 4, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 14,
    padding: 16, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5 },
  statCount: { fontSize: 28, fontWeight: '800', color: C.primary },

  // Filter tabs
  filterTabsScroll: { gap: 8, paddingBottom: 8, marginBottom: 8 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  filterTabTextActive: { color: '#FFF' },

  // Order Card
  orderCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    gap: 12,
  },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  orderDate: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Product preview
  orderProductRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderImgWrap: {
    width: 56, height: 56, borderRadius: 10,
    overflow: 'hidden', backgroundColor: '#F0F4FA',
  },
  orderImg: { width: '100%', height: '100%' },
  orderImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orderItemName: { fontSize: 14, fontWeight: '600', color: C.textPrimary, lineHeight: 19 },
  orderVendor: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // Footer
  orderCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12,
  },
  orderTotal: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  // States
  loadingBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 14, color: C.textSecondary },
  errorBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  errorText: { fontSize: 14, color: C.danger, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: {
    alignItems: 'center', paddingVertical: 48, gap: 12, paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  emptySubtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21 },
  shopBtn: {
    backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 8,
  },
  shopBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
