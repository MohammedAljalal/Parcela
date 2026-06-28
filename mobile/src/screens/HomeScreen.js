import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchProducts } from '../store/slices/productSlice';
import { logout } from '../store/slices/authSlice';
import { addItem } from '../store/slices/cartSlice';
import { fetchBanners, fetchCategories } from '../store/slices/catalogSlice';
import { toggleWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { getIslands } from '../api/islands';
import toast from '../utils/toast';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Design Tokens (exact match to design) ───────────────────────────────────
const C = {
  primary:       '#0D47A1',
  primaryDark:   '#0A2E78',
  yellow:        '#FFC107',
  bg:            '#F5F5F5',
  surface:       '#FFFFFF',
  textPrimary:   '#1A1A1A',
  textSecondary: '#777777',
  textMuted:     '#AAAAAA',
  border:        '#E5E5E5',
  danger:        '#EF4444',
};

const PAD         = 16;   // horizontal screen padding
const SECTION_GAP = 20;   // vertical space between sections
const GRID_GAP    = 12;   // gap between product cards
const CARD_PAD    = 10;   // card internal padding
const CARD_W      = (SCREEN_W - PAD * 2 - GRID_GAP) / 2;
const IMG_H       = 130;  // fixed image height — same for every card
const TAB_H       = 70;   // bottom tab bar height
const BANNER_H    = 140;  // banner height

// ─── Dynamic Category Styling Helpers ──────────────────────────────────────────
const CATEGORY_STYLES = {
  moda: { icon: 'shirt-outline', bg: '#E3F2FD' },
  eletrônicos: { icon: 'laptop-outline', bg: '#E8F5E9' },
  casa: { icon: 'home-outline', bg: '#FFF3E0' },
  mercearia: { icon: 'basket-outline', bg: '#FCE4EC' },
  default: { icon: 'grid-outline', bg: '#F3F4F6' },
};

// Extract a plain string from a name that may be a multilingual object { pt, en } or a string
const getCategoryName = (name) => {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') return name.pt || name.en || Object.values(name)[0] || '';
  return String(name);
};

// Same as above but with a fallback value — used for banner fields
const getLocalizedText = (field, fallback = '') => {
  if (!field) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'object') return field.pt || field.en || Object.values(field)[0] || fallback;
  return String(field) || fallback;
};

const getCategoryStyle = (name) => {
  const n = getCategoryName(name).toLowerCase();
  for (const key in CATEGORY_STYLES) {
    if (key !== 'default' && n.includes(key)) return CATEGORY_STYLES[key];
  }
  return CATEGORY_STYLES.default;
};

// TABS array removed since it is now handled by Expo Router

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCVE = (price) => {
  if (price == null) return '0$00';
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '$00';
};

const getInitials = (user) => {
  const name = user?.name || user?.email || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.slice(0, 2) || 'SA').toUpperCase();
};

const getProductImage = (product) => {
  const img = product?.images?.[0];
  if (!img) return null;
  return typeof img === 'string' ? img : (img.url ?? img.secure_url ?? null);
};

const getProductName = (p) =>
  p?.name?.pt || p?.name?.en || (typeof p?.name === 'string' ? p.name : '') || 'Produto';

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({ product, onPress, onAddToCart, isFav, onToggleWishlist }) => {
  const imgUrl    = getProductImage(product);
  const isPromo   = !!product?.isPromoted;
  const name      = getProductName(product);
  const price     = product?.price ?? 0;
  // Backend field is compareAtPrice (not originalPrice)
  const origPrice = product?.compareAtPrice;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      {/* ── Image ── */}
      <View style={s.cardImgWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={s.cardImg} resizeMode="cover" />
        ) : (
          <View style={s.cardImgPlaceholder}>
            <Ionicons name="image-outline" size={32} color="#CCC" />
          </View>
        )}

        {/* Promo badge */}
        {isPromo && (
          <View style={s.promoBadge}>
            <Text style={s.promoBadgeText}>PROMOÇÃO</Text>
          </View>
        )}

        {/* Heart button — connected to real Wishlist API */}
        <TouchableOpacity
          style={s.heartBtn}
          onPress={() => onToggleWishlist?.(product._id)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={15}
            color={isFav ? C.danger : '#BBBBBB'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Info ── */}
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={2}>{name}</Text>
        <View style={s.priceRow}>
          <View>
            {isPromo && origPrice ? (
              <Text style={s.origPrice}>{formatCVE(origPrice)}</Text>
            ) : null}
            <Text style={s.priceText}>{formatCVE(price)}</Text>
          </View>
          <TouchableOpacity style={s.cartBtn} onPress={onAddToCart} activeOpacity={0.8}>
            <Ionicons name="cart" size={15} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const user     = useSelector((state) => state.auth.user);
  const { products, loading, error } = useSelector((state) => state.products);
  const { categories, banners } = useSelector((state) => state.catalog);
  const { productIds: wishlistIds } = useSelector((state) => state.wishlist);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const [showIslandModal, setShowIslandModal] = useState(false);
  const [islands, setIslands] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState(user?.island || 'Santiago (ST)');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchBanners());
    dispatch(fetchCategories());
    dispatch(fetchWishlist());
    getIslands().then(res => setIslands(res.data?.data?.islands || [])).catch(console.error);
  }, [dispatch]);

  const handleRetry   = useCallback(() => dispatch(fetchProducts()), [dispatch]);
  const handleLogout  = useCallback(() => { dispatch(logout()); router.replace('/'); }, [dispatch, router]);
  const handleProduct = useCallback(
    (p) => router.push({ pathname: '/product-details', params: { id: p._id, slug: p.slug } }),
    [router]
  );
  const handleAddCart = useCallback(async (p) => {
    try {
      await dispatch(addItem({ productId: p._id, quantity: 1 })).unwrap();
      toast.cart(p.name?.pt || p.name);
    } catch (err) {
      toast.error(err?.message || err || 'Falha ao adicionar ao carrinho', 'Erro');
    }
  }, [dispatch]);

  const handleToggleWishlist = useCallback(async (productId, product) => {
    try {
      const { items } = store.getState().wishlist;
      const wasInWishlist = items.some((item) => {
        const id = item.product?._id ?? item.product ?? item._id;
        return id === productId;
      });
      await dispatch(toggleWishlist(productId)).unwrap();
      toast.wishlist(!wasInWishlist);
    } catch (err) {
      toast.error(err?.message || err || 'Erro ao atualizar favorito');
    }
  }, [dispatch]);

  const filtered = search.trim()
    ? products.filter((p) => getProductName(p).toLowerCase().includes(search.toLowerCase()))
    : products;

  const initials = getInitials(user);

  const renderItem = useCallback(
    ({ item, index }) => (
      <View
        style={[
          s.cardWrapper,
          index % 2 === 0 ? { marginRight: GRID_GAP / 2 } : { marginLeft: GRID_GAP / 2 },
        ]}
      >
        <ProductCard
          product={item}
          onPress={() => handleProduct(item)}
          onAddToCart={() => handleAddCart(item)}
          isFav={wishlistIds.includes(item._id)}
          onToggleWishlist={handleToggleWishlist}
        />
      </View>
    ),
    [handleProduct, handleAddCart, handleToggleWishlist, wishlistIds]
  );

  // ── List Header (memoised to prevent FlatList scroll-jump) ─────────────
  const ListHeader = React.useMemo(() => (
    <>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <MaterialCommunityIcons name="view-grid" size={20} color={C.primary} />
          <Text style={s.brand}>Parcela</Text>
        </View>

        <TouchableOpacity style={s.locationPill} activeOpacity={0.7} onPress={() => setShowIslandModal(true)}>
          <Ionicons name="location-sharp" size={12} color={C.primary} />
          <Text style={s.locationText}>{selectedIsland}</Text>
          <Ionicons name="chevron-down" size={12} color={C.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[s.avatar, { backgroundColor: '#8B5CF6' }]} activeOpacity={0.8} onPress={() => router.push('/profile')}>
          <Text style={s.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <TouchableOpacity
        style={s.searchWrap}
        activeOpacity={0.8}
        onPress={() => router.push('/search')}
      >
        <Ionicons name="search" size={17} color={C.textMuted} />
        <Text style={[s.searchInput, { color: C.textMuted }]}>
          {t('home.searchPlaceholder')}
        </Text>
      </TouchableOpacity>

      {/* ── Banners ── */}
      {banners?.length > 0 ? (
        <View style={s.bannerContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / (SCREEN_W - PAD * 2));
              setActiveBanner(idx);
            }}
            scrollEventThrottle={16}
          >
            {banners.map((banner, index) => (
              <View key={banner._id || index} style={[s.bannerSlide, { width: SCREEN_W - PAD * 2 }]}>
                {/* Backend field: banner.image (not banner.imageUrl) */}
                {banner.image ? (
                  <Image
                    source={{ uri: banner.image }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <View style={s.bannerCircle1} />
                    <View style={s.bannerCircle2} />
                  </>
                )}
                <View style={[s.bannerContent, banner.image && { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16 }]}>
                  <Text style={[s.bannerEyebrow, banner.image && { color: C.yellow }]}>
                    {getLocalizedText(banner.title, t('home.specialOffer'))}
                  </Text>
                  <Text style={[s.bannerTitle, banner.image && { color: '#FFF' }]}>
                    {getLocalizedText(banner.subtitle, t('home.freeDelivery'))}
                  </Text>
                  {/* ctaLink = backend field for the banner button URL, ctaLabel = button text */}
                  <TouchableOpacity
                    style={s.bannerCta}
                    activeOpacity={0.85}
                    onPress={() => banner.ctaLink ? router.push(banner.ctaLink) : router.push('/search')}
                  >
                    <Text style={s.bannerCtaText}>
                      {getLocalizedText(banner.ctaLabel, t('home.buyNow'))}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          {banners.length > 1 && (
            <View style={s.bannerDots}>
              {banners.map((_, i) => (
                <View key={i} style={i === activeBanner ? s.dotActive : s.dotInactive} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={s.banner}>
          <View style={s.bannerCircle1} />
          <View style={s.bannerCircle2} />
          <View style={s.bannerContent}>
            <Text style={s.bannerEyebrow}>{t('home.specialOffer')}</Text>
            <Text style={s.bannerTitle}>{t('home.freeDelivery')}</Text>
            <TouchableOpacity style={s.bannerCta} activeOpacity={0.85}>
              <Text style={s.bannerCtaText}>{t('home.buyNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Categories ── */}
      <View style={s.sectionWrap}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>{t('home.categories')}</Text>
          <TouchableOpacity onPress={() => router.push('/categories')}>
            <Text style={s.sectionLink}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.catsRow}>
          {(categories && categories.length > 0 ? categories.slice(0, 4) : []).map((cat) => {
            const style = getCategoryStyle(cat.name);
            const label = getCategoryName(cat.name);
            return (
              <TouchableOpacity key={cat._id} style={s.catItem} activeOpacity={0.7} onPress={() => router.push({ pathname: '/search', params: { category: cat._id } })}>
                <View style={[s.catCircle, { backgroundColor: style.bg, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }]}>
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons name={style.icon} size={24} color={C.primary} />
                  )}
                </View>
                <Text style={s.catLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Destaques Header ── */}
      <View style={[s.sectionRow, { marginBottom: 14 }]}>
        <Text style={s.sectionTitle}>{t('home.highlights')}</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Loading ── */}
      {loading && (
        <View style={s.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.stateText}>A carregar produtos...</Text>
        </View>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <View style={s.stateBox}>
          <Ionicons name="cloud-offline-outline" size={44} color={C.danger} />
          <Text style={[s.stateText, { color: C.danger }]}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [initials, search, loading, error, banners, categories, t, router, activeBanner]);

  // ── List Footer ──────────────────────────────────────────────────────────
  const ListFooter = React.useMemo(() => (
    <View style={{ marginTop: SECTION_GAP }}>
      <View style={s.trackingCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.trackingTitle}>{t('home.realTimeTracking')}</Text>
          <Text style={s.trackingSub}>{t('home.knowExactly')}</Text>
        </View>
        <View style={s.truckCircle}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={26} color={C.primary} />
        </View>
      </View>
      {/* Space for tab bar removed, native tabs handle it */}
    </View>
  ), []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <FlatList
        data={!loading && !error ? filtered : []}
        keyExtractor={(item) => item._id?.toString() ?? String(Math.random())}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={s.stateBox}>
              <Ionicons name="search-outline" size={40} color={C.textMuted} />
              <Text style={s.stateText}>Nenhum produto encontrado</Text>
            </View>
          ) : null
        }
        contentContainerStyle={s.listContent}
        columnWrapperStyle={s.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
      
      {/* ── Island Picker Modal ── */}
      <Modal visible={showIslandModal} transparent animationType="fade" onRequestClose={() => setShowIslandModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('home.selectIsland', 'Selecione a sua Ilha')}</Text>
              <TouchableOpacity onPress={() => setShowIslandModal(false)} style={s.closeModalBtn}>
                <Ionicons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={islands}
              keyExtractor={item => item._id}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={s.islandItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedIsland(`${item.name} (${item.code})`);
                    setShowIslandModal(false);
                  }}
                >
                  <Text style={s.islandText}>{item.name} ({item.code})</Text>
                  {selectedIsland === `${item.name} (${item.code})` && (
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  listContent: {
    paddingHorizontal: PAD,
    // Enough bottom padding so the last card clears the native tab bar
    paddingBottom: TAB_H + 16,
  },
  columnWrapper: {
    marginBottom: GRID_GAP,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontSize: 19,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textPrimary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── Search Bar
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: SECTION_GAP,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  // ── Banner Container
  bannerContainer: {
    marginBottom: SECTION_GAP,
  },

  // ── Individual banner slide (fixed height)
  bannerSlide: {
    height: BANNER_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0D47A1',
    justifyContent: 'center',
  },

  // ── Fallback banner (no API data)
  banner: {
    height: BANNER_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0D47A1',
    justifyContent: 'center',
    marginBottom: SECTION_GAP,
  },

  // ── Decorative circles inside banner
  bannerCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: -50,
    top: -50,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)',
    right: 20,
    bottom: -35,
  },
  bannerContent: {
    paddingHorizontal: 20,
    zIndex: 1,
  },
  bannerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 12,
  },
  bannerCta: {
    alignSelf: 'flex-start',
    backgroundColor: C.yellow,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  bannerCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
  },
  bannerDots: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 5,
    zIndex: 1,
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // ── Section ──────────────────────────────────────────────────────────────
  sectionWrap: {
    marginBottom: SECTION_GAP,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },

  // ── Categories ──────────────────────────────────────────────────────────
  catsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catItem: {
    alignItems: 'center',
    gap: 8,
  },
  catCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textSecondary,
    textAlign: 'center',
  },

  // ── Product Card ─────────────────────────────────────────────────────────
  cardWrapper: {
    width: CARD_W,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImgWrap: {
    width: '100%',
    height: IMG_H,
    backgroundColor: '#EEEEEE',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardImgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FA',
  },
  promoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  promoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBody: {
    padding: CARD_PAD,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  origPrice: {
    fontSize: 11,
    color: C.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.yellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Tracking Card ────────────────────────────────────────────────────────
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EDF8',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  trackingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    lineHeight: 21,
    marginBottom: 4,
  },
  trackingSub: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 17,
  },
  truckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── State Boxes ──────────────────────────────────────────────────────────
  stateBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // ── Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: PAD,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  closeModalBtn: {
    padding: 4,
  },
  islandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  islandText: {
    fontSize: 16,
    color: C.textPrimary,
  },
});
