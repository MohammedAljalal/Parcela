import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Share,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../src/store/slices/cartSlice';
import { toggleWishlist } from '../src/store/slices/wishlistSlice';
import { getProductBySlug } from '../src/api/products';
import { getProductReviews } from '../src/api/reviews';
import toast from '../src/utils/toast';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#0D47A1',
  primaryDark:   '#0A2E78',
  yellow:        '#FFC107',
  bg:            '#FFFFFF',
  bgGrey:        '#F5F7FA',
  surface:       '#FFFFFF',
  textPrimary:   '#1A1A1A',
  textSecondary: '#777777',
  textMuted:     '#AAAAAA',
  border:        '#E5E5E5',
  danger:        '#EF4444',
  success:       '#22C55E',
  tagBg:         '#FFF176',
  tagText:       '#1A1A1A',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCVE = (price) => {
  if (price == null) return '0$00';
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '$00';
};

const getProductName = (p) =>
  p?.name?.pt || p?.name?.en || (typeof p?.name === 'string' ? p.name : '') || 'Produto';

const getCategoryName = (p) => {
  const cat = p?.category;
  if (!cat) return null;
  return cat?.name?.pt || cat?.name?.en || (typeof cat?.name === 'string' ? cat.name : null);
};

const getImages = (p) => {
  const imgs = p?.images ?? [];
  if (!imgs.length) return [];
  return imgs.map((img) =>
    typeof img === 'string' ? img : (img.url ?? img.secure_url ?? null)
  ).filter(Boolean);
};

// Build a specs grid from the product (fallback to generic display)
const buildSpecs = (product) => {
  const specs = [];
  if (product?.specifications?.length) {
    product.specifications.forEach((s) => specs.push({ icon: 'cube-outline', label: s.name, value: s.value }));
  } else {
    // Fallback generic specs from common fields
    if (product?.weight) specs.push({ icon: 'scale-outline', label: 'Peso', value: `${product.weight}g` });
    if (product?.stock != null) specs.push({ icon: 'layers-outline', label: 'Stock', value: `${product.stock} unidades` });
  }
  return specs;
};

const SPEC_ICONS = ['hardware-chip-outline', 'camera-outline', 'battery-charging-outline', 'tv-outline'];

// ─── Image Carousel ───────────────────────────────────────────────────────────
function ImageCarousel({ images }) {
  const [active, setActive] = useState(0);
  const { width: screenW } = useWindowDimensions();

  if (!images.length) {
    return (
      <View style={styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={64} color={C.textMuted} />
      </View>
    );
  }

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
    setActive(idx);
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ width: screenW }}
        contentContainerStyle={{ flexDirection: 'row' }}
      >
        {images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={[styles.carouselImage, { width: screenW }]} resizeMode="contain" />
        ))}
      </ScrollView>
      {/* Dot indicators - outside absolute to avoid blocking touches */}
      <View style={styles.dotsRow} pointerEvents="none">
        {images.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Spec Card ────────────────────────────────────────────────────────────────
function SpecCard({ iconName, label, value }) {
  return (
    <View style={styles.specCard}>
      <Ionicons name={iconName} size={20} color={C.primary} />
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id, slug } = useLocalSearchParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Read wishlist IDs from Redux to sync heart state with backend
  const wishlistIds = useSelector((s) => s.wishlist.productIds);
  const cartLoading = useSelector((s) => s.cart.loading);

  // ── Load product ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const identifier = slug || id;
    if (!identifier) { setError('Produto não encontrado'); setLoading(false); return; }

    setLoading(true);
    getProductBySlug(identifier)
      .then((res) => {
        if (!cancelled) {
          const fetchedProduct = res.data?.data?.product ?? res.data?.data ?? null;
          setProduct(fetchedProduct);
          setLoading(false);
          
          if (fetchedProduct?._id) {
            setReviewsLoading(true);
            getProductReviews(fetchedProduct._id)
              .then(revRes => {
                if (!cancelled) {
                  setReviews(revRes.data?.data?.reviews ?? revRes.data?.reviews ?? []);
                }
              })
              .catch(() => {})
              .finally(() => { if (!cancelled) setReviewsLoading(false); });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message ?? err.message ?? 'Erro ao carregar produto');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug, id]);

  // Sync heart icon with redux wishlist state whenever product loads
  useEffect(() => {
    if (product?._id) {
      setIsFav(wishlistIds.includes(product._id));
    }
  }, [product, wishlistIds]);

  const handleAddToCart = useCallback(async () => {
    if (!product?._id) return;
    setAddingToCart(true);
    try {
      await dispatch(addItem({ productId: product._id, quantity })).unwrap();
      toast.cart(getProductName(product));
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message ?? 'Falha ao adicionar ao carrinho';
      toast.error(msg, 'Não foi possível adicionar');
    } finally {
      setAddingToCart(false);
    }
  }, [dispatch, product, quantity]);

  const handleToggleFav = useCallback(async () => {
    if (!product?._id || favLoading) return;
    setFavLoading(true);
    try {
      const wasInWishlist = isFav;
      await dispatch(toggleWishlist(product._id)).unwrap();
    } catch (err) {
      const msg = err?.message || err || 'Erro ao atualizar favorito';
      toast.error(msg);
    } finally {
      setFavLoading(false);
    }
  }, [dispatch, product, favLoading]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        title: getProductName(product),
        message: `${getProductName(product)} — ${formatCVE(product.price)}\n\nParcela - Compras Online em Cabo Verde`,
      });
    } catch (_) {}
  }, [product]);

  const handleQtyChange = (delta) => {
    setQuantity((q) => Math.max(1, Math.min(q + delta, product?.stock ?? 99)));
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
          <Text style={styles.errorText}>{error || 'Produto não encontrado'}</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtnFull}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const images     = getImages(product);
  const name       = getProductName(product);
  const categoryName = getCategoryName(product);
  const price      = product.price ?? 0;
  const stock      = product.stock ?? 0;
  const description = product.description?.pt || product.description?.en
    || (typeof product.description === 'string' ? product.description : '');
  const specs      = buildSpecs(product);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color={C.textPrimary} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleToggleFav} disabled={favLoading}>
            {favLoading ? (
              <ActivityIndicator size="small" color={C.danger} />
            ) : (
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? C.danger : C.textPrimary}
              />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Image Carousel ────────────────────────────────────────────────── */}
        <ImageCarousel images={images} />

        {/* ── Category + Stock ──────────────────────────────────────────────── */}
        <View style={styles.metaRow}>
          {categoryName && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{categoryName}</Text>
            </View>
          )}
          <View style={styles.stockRow}>
            <MaterialCommunityIcons name="package-variant-closed" size={14} color={C.success} />
            <Text style={styles.stockText}>Stock: {stock} unidades</Text>
          </View>
        </View>

        {/* ── Product Name + Price ──────────────────────────────────────────── */}
        <View style={styles.titleSection}>
          <Text style={styles.productName}>{name}</Text>
          <Text style={styles.productPrice}>{formatCVE(price)}</Text>
        </View>

        {/* ── Description ──────────────────────────────────────────────────── */}
        {!!description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        )}

        {/* ── Specs Grid ───────────────────────────────────────────────────── */}
        {specs.length > 0 && (
          <View style={styles.specsGrid}>
            {specs.map((spec, i) => (
              <SpecCard
                key={i}
                iconName={spec.icon ?? SPEC_ICONS[i % SPEC_ICONS.length]}
                label={spec.label}
                value={spec.value}
              />
            ))}
          </View>
        )}

        {/* ── Delivery Banner ───────────────────────────────────────────────── */}
        <View style={styles.deliveryBanner}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={22} color={C.primary} />
          <View style={styles.deliveryBannerText}>
            <Text style={styles.deliveryTitle}>Entrega em 24/48h</Text>
            <Text style={styles.deliverySubtitle}>Disponível para todo o arquipélago</Text>
          </View>
        </View>

        {/* ── Reviews ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Avaliações ({reviews.length})</Text>
            {product.rating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFF" />
                <Text style={styles.ratingBadgeText}>{product.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          
          {reviewsLoading ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 20 }} />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Ainda não há avaliações para este produto.</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {(rev.user?.name || rev.user?.email || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.reviewName}>{rev.user?.name || 'Utilizador'}</Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= rev.rating ? "star" : "star-outline"}
                        size={14}
                        color={s <= rev.rating ? C.yellow : C.textMuted}
                      />
                    ))}
                  </View>
                </View>
                {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
              </View>
            ))
          )}
        </View>

        {/* Bottom spacer for floating bar */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Bottom Bar ─────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {/* Quantity */}
        <View style={styles.qtyContainer}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => handleQtyChange(-1)}
            disabled={quantity <= 1}
          >
            <Text style={[styles.qtyBtnText, quantity <= 1 && { color: C.textMuted }]}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => handleQtyChange(1)}
            disabled={quantity >= stock}
          >
            <Text style={[styles.qtyBtnText, quantity >= stock && { color: C.textMuted }]}>+</Text>
          </Pressable>
        </View>

        {/* Add to Cart */}
        <Pressable
          style={[styles.addToCartBtn, (addingToCart || stock === 0) && { opacity: 0.7 }]}
          onPress={handleAddToCart}
          disabled={addingToCart || stock === 0}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="cart" size={18} color="#FFF" />
              <Text style={styles.addToCartText}>
                {stock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.bg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.bgGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
  },
  backBtnFull: {
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  scroll: {
    paddingBottom: 8,
  },

  // Image Carousel
  carouselContainer: {
    backgroundColor: C.bgGrey,
    height: 260,
    overflow: 'hidden',
  },
  carouselImage: {
    height: 260,
  },
  imagePlaceholder: {
    height: 260,
    backgroundColor: C.bgGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
  dotActive: {
    width: 20,
    backgroundColor: C.primary,
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  categoryTag: {
    backgroundColor: C.yellow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.tagText,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.success,
  },

  // Title
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    lineHeight: 30,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: C.primary,
  },

  // Description
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
  },

  // Specs
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  specCard: {
    width: (SCREEN_W - 32 - 10) / 2,
    backgroundColor: C.bgGrey,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  specLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },

  // Delivery Banner
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#EEF3FC',
    borderRadius: 14,
    padding: 14,
  },
  deliveryBannerText: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
  deliverySubtitle: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgGrey,
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: C.textPrimary,
  },
  qtyValue: {
    width: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 50,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Reviews
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  noReviewsText: {
    fontSize: 14,
    color: C.textSecondary,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: C.bgGrey,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
  },
});
