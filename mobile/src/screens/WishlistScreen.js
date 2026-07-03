import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchWishlist, toggleWishlist } from '../store/slices/wishlistSlice';
import { addItem } from '../store/slices/cartSlice';
import toast from '../utils/toast';

const C = {
  primary: '#0D47A1', primaryLight: '#E6F0FC', yellow: '#FFC107',
  bg: '#F8F9FB', surface: '#FFFFFF', textPrimary: '#1A1A1A',
  textSecondary: '#666666', textMuted: '#999999', border: '#F0F0F0',
  danger: '#EF4444',
};

const formatCVE = (price) => {
  if (price == null) return '0$00';
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '$00';
};

const getProductImage = (p) => {
  const img = p?.images?.[0];
  if (!img) return null;
  return typeof img === 'string' ? img : (img.url ?? img.secure_url ?? null);
};

const getProductName = (p) =>
  p?.name?.pt || p?.name?.en || (typeof p?.name === 'string' ? p.name : '') || 'Produto';

export default function WishlistScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.wishlist);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  const handleRemove = async (productId) => {
    try {
      await dispatch(toggleWishlist(productId)).unwrap();
      toast.info('Removido dos favoritos');
    } catch (err) {
      toast.error('Erro ao remover dos favoritos');
    }
  };

  const handleAddToCart = async (productId, name) => {
    try {
      await dispatch(addItem({ productId, quantity: 1 })).unwrap();
      toast.cart(name);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Erro ao adicionar ao carrinho');
    }
  };

  const renderItem = ({ item }) => {
    const product = item.product ?? item;
    const imgUrl = getProductImage(product);
    const name = getProductName(product);
    const productId = product._id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/product-details', params: { id: productId, slug: product.slug } })}
        activeOpacity={0.8}
      >
        {/* Image */}
        <View style={styles.imgBox}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={[styles.img, styles.imgPlaceholder]}>
              <Ionicons name="image-outline" size={28} color="#CCC" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={2}>{name}</Text>
          <Text style={styles.price}>{formatCVE(product.price)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => handleAddToCart(productId)}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={18} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(productId)}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={18} color={C.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista de Desejos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => item._id ?? idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="heart-outline" size={56} color={C.textMuted} />
              <Text style={styles.emptyTitle}>A sua lista está vazia</Text>
              <Text style={styles.emptySubtitle}>Adicione produtos à sua lista de desejos premindo o ❤️</Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => router.replace('/(tabs)/home')}
                activeOpacity={0.8}
              >
                <Text style={styles.shopBtnText}>Ir às Compras</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 16, padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  imgBox: { width: 70, height: 70, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F4FA' },
  img: { width: 70, height: 70 },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  productName: { fontSize: 13, fontWeight: '600', color: C.textPrimary, lineHeight: 18 },
  price: { fontSize: 15, fontWeight: '700', color: C.primary },
  actions: { gap: 8 },
  cartBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },

  emptyBox: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  shopBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 8 },
  shopBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
