import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchCategories } from '../store/slices/catalogSlice';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

// ─── Fallback categories (shown if API has no data yet) ──────────────────────
const FALLBACK_CATEGORIES = [
  {
    _id: '1',
    name: { pt: 'Moda' },
    description: '4.2k Produtos',
    image: { url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop' },
    isFeatured: true,
  },
  {
    _id: '2',
    name: { pt: 'Eletrónicos' },
    description: '850 Produtos',
    image: { url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop' },
  },
  {
    _id: '3',
    name: { pt: 'Casa' },
    description: '1.1k Produtos',
    image: { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop' },
  },
  {
    _id: '4',
    name: { pt: 'Mercearia' },
    description: 'Disponível agora',
    image: { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop' },
    isFeatured: true,
  },
  {
    _id: '5',
    name: { pt: 'Saúde & Beleza' },
    description: '600+ Marcas',
    image: { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop' },
  },
  {
    _id: '6',
    name: { pt: 'Livros' },
    description: '2.5k Títulos',
    image: { url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1000&auto=format&fit=crop' },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getCategoryName = (cat) =>
  cat?.name?.pt || cat?.name?.en || (typeof cat?.name === 'string' ? cat.name : '') || 'Categoria';

const getCategoryImage = (cat) => {
  const img = cat?.image;
  if (!img) return null;
  return typeof img === 'string' ? img : (img.url ?? img.secure_url ?? null);
};

const getCategorySubtitle = (cat) => {
  const desc = cat?.description?.pt || cat?.description?.en || cat?.description;
  if (typeof desc === 'string' && desc) return desc;
  return cat?.subtitle || `${cat?.productsCount || 0} Produtos`;
};

const getCategoryBadge = (cat) =>
  cat?.badge?.pt || cat?.badge?.en || (typeof cat?.badge === 'string' ? cat.badge : null);

// ─── Category Card ────────────────────────────────────────────────────────────
const CategoryCard = ({ category, fullWidth }) => {
  const imageUrl = getCategoryImage(category);
  const name = getCategoryName(category);
  const subtitle = getCategorySubtitle(category);
  const badge = getCategoryBadge(category);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardTouch,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
    >
      <ImageBackground
        source={imageUrl ? { uri: imageUrl } : undefined}
        style={styles.cardBackground}
        imageStyle={styles.cardImageStyle}
      >
        {!imageUrl && (
          <View style={[styles.cardBackground, styles.cardPlaceholder]}>
            <Ionicons name="image-outline" size={32} color="#CCC" />
          </View>
        )}
        <View style={styles.cardOverlay}>
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              {badge ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardBottom}>
              {subtitle ? (
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
              ) : null}
              <Text style={styles.cardTitle}>{name}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

// ─── Grid Layout ──────────────────────────────────────────────────────────────
function buildGrid(categories) {
  const rows = [];
  let i = 0;

  while (i < categories.length) {
    const cat = categories[i];
    // Every 3rd item (index 0, 3, 6, ...) is a full-width "hero" card
    const isFeatured = cat.isFeatured || i % 3 === 0;
    if (isFeatured) {
      rows.push({ type: 'full', cat });
      i++;
    } else {
      // Pair the next two as half-width
      rows.push({ type: 'pair', cats: [categories[i], categories[i + 1]].filter(Boolean) });
      i += 2;
    }
  }
  return rows;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CategoriesScreen() {
  const dispatch = useDispatch();
  const { categories, loadingCategories, errorCategories } = useSelector((s) => s.catalog);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Use real data if available, fallback to mock
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const grid = buildGrid(displayCategories);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Categorias</Text>
          <Text style={styles.headerSubtitle}>Explore produtos selecionados por categoria</Text>
        </View>

        {/* Loading Indicator */}
        {loadingCategories && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Error State */}
        {!loadingCategories && errorCategories && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Erro ao carregar categorias</Text>
            <TouchableOpacity onPress={() => dispatch(fetchCategories())} style={styles.retryBtn}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid */}
        <View style={styles.grid}>
          {grid.map((row, idx) => {
            if (row.type === 'full') {
              return (
                <View key={row.cat._id ?? idx} style={styles.fullWidthContainer}>
                  <CategoryCard category={row.cat} fullWidth />
                </View>
              );
            }
            return (
              <View key={idx} style={styles.row}>
                {row.cats.map((cat) => (
                  <View key={cat._id} style={styles.halfWidthContainer}>
                    <CategoryCard category={cat} />
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Decorative footer */}
        <View style={styles.footerDecoration}>
          <Text style={styles.footerWaves}>〰️〰️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fullWidthContainer: {
    width: '100%',
    height: 180,
    marginBottom: spacing.md,
  },
  halfWidthContainer: {
    flex: 1,
    height: 180,
  },
  cardTouch: {
    flex: 1,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    shadowColor: colors.shadowNeutral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardImageStyle: {
    borderRadius: spacing.radiusLg,
  },
  cardPlaceholder: {
    backgroundColor: '#F0F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    borderRadius: spacing.radiusLg,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardTop: {
    alignItems: 'flex-end',
  },
  cardBottom: {},
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeContainer: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  footerDecoration: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    opacity: 0.2,
  },
  footerWaves: {
    fontSize: 40,
    color: colors.primary,
  },
});
