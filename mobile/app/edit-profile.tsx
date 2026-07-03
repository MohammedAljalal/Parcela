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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  // Set initial state if user data loads later
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      setAvatar(base64Image);
    }
  };

  const handleSave = () => {
    dispatch(updateProfile({ name, phone, avatar }))
      .unwrap()
      .then(() => {
        router.back();
      })
      .catch((err) => {
        // Handle error (already in state.error)
        console.error(err);
      });
  };

  const isChanged = name !== (user?.name || '') || phone !== (user?.phone || '') || avatar !== (user?.avatar || '');

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
          
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color={C.textSecondary} />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    padding: 4,
    backgroundColor: C.surface,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: C.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.surface,
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
