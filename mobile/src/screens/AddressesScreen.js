import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchAddresses, removeAddress, makeDefaultAddress } from '../store/slices/addressSlice';
import toast from '../utils/toast';

const C = {
  primary: '#0D47A1', primaryLight: '#E6F0FC', yellow: '#FFC107',
  bg: '#F8F9FB', surface: '#FFFFFF', textPrimary: '#1A1A1A',
  textSecondary: '#666666', textMuted: '#999999', border: '#F0F0F0',
  danger: '#EF4444', dangerLight: '#FEE2E2', green: '#22C55E', greenLight: '#DCFCE7',
};

export default function AddressesScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.addresses);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);

  const handleDelete = (id) => {
    Alert.alert('Eliminar Endereço', 'Tem a certeza que deseja eliminar este endereço?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await dispatch(removeAddress(id)).unwrap();
            toast.info('Endereço eliminado');
          } catch (err) {
            toast.error(typeof err === 'string' ? err : 'Erro ao eliminar');
          }
      } },
    ]);
  };

  const handleSetDefault = async (id) => {
    try {
      await dispatch(makeDefaultAddress(id)).unwrap();
      toast.success('Endereço principal atualizado');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Erro ao atualizar');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="location-outline" size={18} color={C.primary} />
          </View>
          <View>
            <Text style={styles.recipientName}>{item.recipient || item.label || 'Endereço'}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Principal</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.addressLine}>{item.address}</Text>
      {item.city ? <Text style={styles.addressLine}>{item.city}</Text> : null}
      {item.island ? <Text style={styles.addressLine}>{item.island}</Text> : null}
      {item.phone ? <Text style={styles.phoneText}>{item.phone}</Text> : null}

      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleSetDefault(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons name="star-outline" size={14} color={C.primary} />
            <Text style={styles.actionBtnText}>Definir como Principal</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => router.push({ pathname: '/add-address', params: { id: item._id } })}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={14} color={C.primary} />
          <Text style={styles.actionBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item._id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={14} color={C.danger} />
          <Text style={[styles.actionBtnText, { color: C.danger }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Os Meus Endereços</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-address')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="location-outline" size={52} color={C.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum endereço guardado</Text>
              <Text style={styles.emptySubtitle}>Adicione um endereço para facilitar as suas compras</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/add-address')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Adicionar Endereço</Text>
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
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  recipientName: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  defaultBadge: { backgroundColor: C.greenLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: C.green },
  addressLine: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  phoneText: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtn: {},
  deleteBtn: { backgroundColor: C.dangerLight },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: C.primary },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
