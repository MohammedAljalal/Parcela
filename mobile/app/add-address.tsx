import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addAddress, editAddress } from '../src/store/slices/addressSlice';
import Input from '../src/components/Input';
import Button from '../src/components/Button';

const C = {
  primary: '#0D47A1', bg: '#F8F9FB', surface: '#FFFFFF',
  textPrimary: '#1A1A1A', textSecondary: '#666666', border: '#E5E5E5',
};

const ISLANDS = ['Santiago', 'São Vicente', 'Santo Antão', 'Sal', 'Fogo', 'Boa Vista', 'São Nicolau', 'Maio', 'Brava', 'Santa Luzia'];

export default function AddAddressRoute() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = useLocalSearchParams();
  const { list, saving, error } = useSelector((s) => s.addresses);

  // If editing, pre-fill from existing address
  const existing = id ? list.find((a) => a._id === id) : null;

  const [recipient, setRecipient] = useState(existing?.recipient ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [island, setIsland] = useState(existing?.island ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [showIslands, setShowIslands] = useState(false);

  const isValid = recipient.trim().length > 1 && address.trim().length > 3;

  const handleSave = () => {
    const body = { recipient, phone, address, city, island, label, isDefault };
    const action = existing
      ? dispatch(editAddress({ id: existing._id, body }))
      : dispatch(addAddress(body));

    action.unwrap()
      .then(() => router.back())
      .catch(() => {}); // error displayed via Redux state
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existing ? 'Editar Endereço' : 'Novo Endereço'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <Input
              label="Nome do Destinatário *"
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Nome completo"
              editable={!saving}
            />
            <View style={{ height: 12 }} />
            <Input
              label="Número de Telefone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+238 000 00 00"
              keyboardType="phone-pad"
              editable={!saving}
            />
            <View style={{ height: 12 }} />
            <Input
              label="Endereço *"
              value={address}
              onChangeText={setAddress}
              placeholder="Rua, número, bairro..."
              editable={!saving}
            />
            <View style={{ height: 12 }} />
            <Input
              label="Cidade"
              value={city}
              onChangeText={setCity}
              placeholder="Ex: Praia, Mindelo..."
              editable={!saving}
            />
            <View style={{ height: 12 }} />

            {/* Island picker */}
            <Text style={styles.fieldLabel}>Ilha</Text>
            <TouchableOpacity
              style={styles.islandPicker}
              onPress={() => setShowIslands(!showIslands)}
              activeOpacity={0.7}
            >
              <Text style={[styles.islandPickerText, !island && styles.placeholderText]}>
                {island || 'Selecione a ilha...'}
              </Text>
              <Ionicons name={showIslands ? 'chevron-up' : 'chevron-down'} size={16} color={C.textSecondary} />
            </TouchableOpacity>
            {showIslands && (
              <View style={styles.islandList}>
                {ISLANDS.map((isl) => (
                  <TouchableOpacity
                    key={isl}
                    style={[styles.islandOption, island === isl && styles.islandOptionSelected]}
                    onPress={() => { setIsland(isl); setShowIslands(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.islandOptionText, island === isl && styles.islandOptionTextSelected]}>
                      {isl}
                    </Text>
                    {island === isl && <Ionicons name="checkmark" size={16} color={C.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 12 }} />
            <Input
              label="Etiqueta (opcional)"
              value={label}
              onChangeText={setLabel}
              placeholder="Ex: Casa, Trabalho..."
              editable={!saving}
            />

            <View style={{ height: 16 }} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Definir como endereço principal</Text>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: '#D1D5DB', true: C.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Button
          label={existing ? 'Guardar Alterações' : 'Adicionar Endereço'}
          onPress={handleSave}
          loading={saving}
          disabled={!isValid || saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  scroll: { padding: 16, paddingBottom: 8 },
  errorBox: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },
  formCard: { backgroundColor: C.surface, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  islandPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA', marginBottom: 4 },
  islandPickerText: { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
  placeholderText: { color: '#9CA3AF' },
  islandList: { borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  islandOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  islandOptionSelected: { backgroundColor: '#EBF2FF' },
  islandOptionText: { fontSize: 14, color: C.textPrimary },
  islandOptionTextSelected: { fontWeight: '700', color: C.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, flex: 1 },
  bottomBar: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
});
