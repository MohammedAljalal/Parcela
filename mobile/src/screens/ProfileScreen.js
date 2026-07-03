import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { logout } from '../store/slices/authSlice';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#0D47A1',
  primaryLight:  '#E6F0FC',
  yellow:        '#FFC107',
  bg:            '#F8F9FB',
  surface:       '#FFFFFF',
  textPrimary:   '#1A1A1A',
  textSecondary: '#666666',
  textMuted:     '#999999',
  border:        '#F0F0F0',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
};

// ─── Components ───────────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Fallback data
  const initials = user?.initials ?? '??';
  const name = user?.name ?? 'Utilizador';
  const phone = user?.phone ?? 'Não definido';
  const role = user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
  const avatar = user?.avatar; // URL to avatar image if exists

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/');
  };

  const navigateToEdit = () => {
    router.push('/edit-profile');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="view-grid" size={20} color={C.primary} />
          <Text style={styles.brand}>Parcela</Text>
        </View>
        <View style={styles.headerInitials}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Avatar Section ────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={C.textMuted} />
              </View>
            )}
            <TouchableOpacity style={styles.editBadge} onPress={navigateToEdit} activeOpacity={0.8}>
              <Ionicons name="pencil" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userRole}>{role}</Text>
        </View>

        {/* ── Info Cards ────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.card} onPress={navigateToEdit} activeOpacity={0.7}>
          <View style={styles.cardIconBox}>
            <Ionicons name="person-outline" size={18} color={C.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Dados Pessoais</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{name} • {phone}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
          <View style={styles.cardIconBox}>
            <Ionicons name="location-outline" size={18} color={C.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Endereço de Entrega</Text>
            <Text style={styles.cardValue} numberOfLines={1}>Não definido</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        {/* ── Settings Group ────────────────────────────────────────────────── */}
        <View style={styles.cardGroup}>
          
          <TouchableOpacity style={styles.groupItem} activeOpacity={0.7}>
            <View style={styles.cardIconBox}>
              <Ionicons name="language-outline" size={18} color={C.primary} />
            </View>
            <Text style={styles.groupItemText}>Idioma</Text>
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeText}>PT</Text>
            </View>
            <Ionicons name="swap-horizontal" size={16} color={C.textMuted} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={styles.groupDivider} />

          <View style={styles.groupItem}>
            <View style={styles.cardIconBox}>
              <Ionicons name="notifications-outline" size={18} color={C.primary} />
            </View>
            <Text style={styles.groupItemText}>Notificações</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#D1D5DB', true: C.primary }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          <View style={styles.groupDivider} />

          <TouchableOpacity style={styles.groupItem} activeOpacity={0.7}>
            <View style={styles.cardIconBox}>
              <Ionicons name="document-text-outline" size={18} color={C.primary} />
            </View>
            <Text style={styles.groupItemText}>Termos de Uso</Text>
            <Ionicons name="open-outline" size={16} color={C.textMuted} />
          </TouchableOpacity>

        </View>

        {/* ── Logout Button ─────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={C.danger} />
          <Text style={styles.logoutBtnText}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerVersion}>Parcela Mobile v2.4.0-ocean</Text>
          <Text style={styles.footerTagline}>Conectando as Ilhas com Confiança</Text>
        </View>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  
  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },
  headerInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textPrimary,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
    padding: 4,
    backgroundColor: C.surface,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSecondary,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },

  // Card Group (Settings)
  cardGroup: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  groupItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  groupDivider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 52,
  },
  languageBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.dangerLight,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 32,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.danger,
  },

  // Footer
  footerInfo: {
    alignItems: 'center',
    gap: 4,
  },
  footerVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSecondary,
  },
  footerTagline: {
    fontSize: 11,
    color: C.textMuted,
  },
});

export default ProfileScreen;
