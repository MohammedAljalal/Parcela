import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../src/store/slices/authSlice';
import Input from '../src/components/Input';
import Button from '../src/components/Button';

const C = {
  primary:       '#0D47A1',
  bg:            '#F8F9FB',
  surface:       '#FFFFFF',
  textPrimary:   '#1A1A1A',
  textSecondary: '#666666',
  border:        '#E5E5E5',
};

export default function EditProfileRoute() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Set initial state if user data loads later
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = () => {
    dispatch(updateProfile({ name, phone }))
      .unwrap()
      .then(() => {
        router.back();
      })
      .catch((err) => {
        // Handle error (already in state.error)
        console.error(err);
      });
  };

  const isChanged = name !== (user?.name || '') || phone !== (user?.phone || '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={styles.formCard}>
            <Input
              label="Nome Completo"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              editable={!loading}
            />

            <View style={{ height: 16 }} />

            <Input
              label="Número de Telefone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+238 000 00 00"
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom Bar ──────────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <Button
          label="Guardar Alterações"
          onPress={handleSave}
          loading={loading}
          disabled={!isChanged || loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
  },
  scroll: {
    padding: 16,
  },
  formCard: {
    backgroundColor: C.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
});
