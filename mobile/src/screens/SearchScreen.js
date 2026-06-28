import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { getProducts } from '../api/products';
import { addItem } from '../store/slices/cartSlice';

const C = {
  primary: '#0D47A1', bg: '#F8F9FB', surface: '#FFFFFF',
  textPrimary: '#1A1A1A', textSecondary: '#666666', border: '#E5E5E5',
  danger: '#EF4444',
};

const formatCVE = (price) => {
  if (price == null) return '0$00';
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '$00';
};

const getProductName = (p) => p?.name?.pt || p?.name?.en || p?.name || 'Produto';

export default function SearchScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { categories } = useSelector((s) => s.catalog);
  
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search trigger
  const timeoutRef = useRef(null);

  const fetchResults = useCallback(async (q, cat) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = {};
      if (q.trim()) params.search = q.trim();
      if (cat) params.category = cat;
      
      const res = await getProducts(params);
      const data = res.data?.data?.products ?? res.data?.data ?? res.data ?? [];
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only search if there's a query or a category selected
    if (query.trim() || activeCategory) {
      timeoutRef.current = setTimeout(() => {
        fetchResults(query, activeCategory);
      }, 500); // 500ms debounce
    } else {
      setResults([]);
      setHasSearched(false);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, activeCategory, fetchResults]);

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addItem({ productId: product._id, quantity: 1 })).unwrap();
    } catch {}
  };

  const renderItem = ({ item }) => {
    const imgUrl = item.images?.[0]?.url || item.images?.[0] || null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/product-details', params: { id: item._id, slug: item.slug } })}
      >
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#CCC" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{getProductName(item)}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{formatCVE(item.price)}</Text>
            <TouchableOpacity style={styles.cartBtn} onPress={() => handleAddToCart(item)}>
              <Ionicons name="cart" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Search Bar Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Procurar produtos..."
            autoFocus
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category Filters ── */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ _id: null, name: { pt: 'Todos' } }, ...categories]}
          keyExtractor={(item) => item._id || 'all'}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item._id;
            return (
              <TouchableOpacity
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setActiveCategory(item._id)}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
                  {getProductName(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color="#E5E5E5" />
          <Text style={styles.noResultsTitle}>Nenhum produto encontrado</Text>
          <Text style={styles.noResultsText}>Tente procurar por outros termos ou ajustar as categorias.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FA',
    borderRadius: 12, paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontSize: 15, color: C.textPrimary },
  filtersContainer: { backgroundColor: C.surface, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F0F4FA', borderWidth: 1, borderColor: 'transparent' },
  filterPillSelected: { backgroundColor: '#EBF2FF', borderColor: C.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  filterTextSelected: { color: C.primary },
  
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  noResultsTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginTop: 16, marginBottom: 8 },
  noResultsText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  
  listContent: { padding: 16, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: C.surface, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardImage: { width: '100%', height: 140 },
  cardImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#F0F4FA', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 10 },
  cardName: { fontSize: 13, fontWeight: '600', color: C.textPrimary, lineHeight: 18, height: 36, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 15, fontWeight: '700', color: C.primary },
  cartBtn: { backgroundColor: C.primary, width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
