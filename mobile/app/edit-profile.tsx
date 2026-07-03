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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user, loading } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [localAvatar, setLocalAvatar] = useState(null);
  
  // Set initial state if user data loads later
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    let payload;
    
    if (localAvatar) {
      payload = new FormData();
      payload.append('name', name);
      // Phone is not editable here as it requires OTP
      
      const filename = localAvatar.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      payload.append('avatar', {
        uri: localAvatar,
        name: filename,
        type,
      });
    } else {
      payload = { name };
    }

    dispatch(updateProfile(payload))
      .unwrap()
      .then(() => {
        router.back();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const isChanged = name !== (user?.name || '') || localAvatar !== null;

  const currentAvatar = localAvatar || user?.avatar;

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
            {/* ── Avatar Picker ── */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {currentAvatar ? (
                  <Image source={{ uri: currentAvatar }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color={C.textMuted} />
                  </View>
                )}
                <TouchableOpacity style={styles.editBadge} onPress={handlePickImage} activeOpacity={0.8}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label={t('register.fullName') || "Nome Completo"}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              editable={!loading}
            />

            <View style={{ height: 16 }} />

            <Input
              label={(t('register.phoneLabel') || "Número de Telefone") + " (Apenas leitura)"}
              value={phone}
              onChangeText={setPhone}
              placeholder="+238 000 00 00"
              keyboardType="phone-pad"
              editable={false}
            />
            <Text style={styles.phoneHint}>Para alterar o telefone, entre em contato com o suporte.</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    borderWidth: 3,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  phoneHint: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 6,
    marginLeft: 4,
  },
});
