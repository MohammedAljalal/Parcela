import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import colors from '../theme/colors';

const COUNTRIES = [
  { code: '+238', flag: '🇨🇻', iso: 'CV', name: 'Cabo Verde' },
  { code: '+351', flag: '🇵🇹', iso: 'PT', name: 'Portugal' },
  { code: '+44',  flag: '🇬🇧', iso: 'GB', name: 'United Kingdom' },
  { code: '+1',   flag: '🇺🇸', iso: 'US', name: 'United States' },
  { code: '+971', flag: '🇦🇪', iso: 'AE', name: 'United Arab Emirates' },
  { code: '+966', flag: '🇸🇦', iso: 'SA', name: 'Saudi Arabia' },
  { code: '+20',  flag: '🇪🇬', iso: 'EG', name: 'Egypt' },
  { code: '+212', flag: '🇲🇦', iso: 'MA', name: 'Morocco' },
  { code: '+213', flag: '🇩🇿', iso: 'DZ', name: 'Algeria' },
  { code: '+216', flag: '🇹🇳', iso: 'TN', name: 'Tunisia' },
  { code: '+249', flag: '🇸🇩', iso: 'SD', name: 'Sudan' },
  { code: '+962', flag: '🇯🇴', iso: 'JO', name: 'Jordan' },
  { code: '+961', flag: '🇱🇧', iso: 'LB', name: 'Lebanon' },
  { code: '+964', flag: '🇮🇶', iso: 'IQ', name: 'Iraq' },
  { code: '+965', flag: '🇰🇼', iso: 'KW', name: 'Kuwait' },
  { code: '+968', flag: '🇴🇲', iso: 'OM', name: 'Oman' },
  { code: '+974', flag: '🇶🇦', iso: 'QA', name: 'Qatar' },
  { code: '+973', flag: '🇧🇭', iso: 'BH', name: 'Bahrain' },
  { code: '+967', flag: '🇾🇪', iso: 'YE', name: 'Yemen' },
  { code: '+90',  flag: '🇹🇷', iso: 'TR', name: 'Turkey' },
  { code: '+33',  flag: '🇫🇷', iso: 'FR', name: 'France' },
  { code: '+49',  flag: '🇩🇪', iso: 'DE', name: 'Germany' },
  { code: '+39',  flag: '🇮🇹', iso: 'IT', name: 'Italy' },
  { code: '+34',  flag: '🇪🇸', iso: 'ES', name: 'Spain' },
  { code: '+55',  flag: '🇧🇷', iso: 'BR', name: 'Brazil' },
  { code: '+91',  flag: '🇮🇳', iso: 'IN', name: 'India' },
  { code: '+86',  flag: '🇨🇳', iso: 'CN', name: 'China' },
  { code: '+81',  flag: '🇯🇵', iso: 'JP', name: 'Japan' },
  { code: '+61',  flag: '🇦🇺', iso: 'AU', name: 'Australia' },
  { code: '+7',   flag: '🇷🇺', iso: 'RU', name: 'Russia' },
  { code: '+27',  flag: '🇿🇦', iso: 'ZA', name: 'South Africa' },
  { code: '+52',  flag: '🇲🇽', iso: 'MX', name: 'Mexico' },
  { code: '+54',  flag: '🇦🇷', iso: 'AR', name: 'Argentina' },
  { code: '+234', flag: '🇳🇬', iso: 'NG', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', iso: 'KE', name: 'Kenya' },
  { code: '+62',  flag: '🇮🇩', iso: 'ID', name: 'Indonesia' },
  { code: '+60',  flag: '🇲🇾', iso: 'MY', name: 'Malaysia' },
  { code: '+65',  flag: '🇸🇬', iso: 'SG', name: 'Singapore' },
  { code: '+82',  flag: '🇰🇷', iso: 'KR', name: 'South Korea' },
];

const CountryPickerModal = ({ countryIso, callingCode, onSelect, disabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const currentCountry = COUNTRIES.find((c) => c.iso === countryIso) || COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.iso.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerFlag}>{currentCountry.flag}</Text>
        <Text style={styles.triggerCode}>{currentCountry.code}</Text>
        <Text style={styles.triggerChevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Country</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or code..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.iso}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  setModalVisible(false);
                  setSearch('');
                }}
              >
                <Text style={styles.itemFlag}>{item.flag}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  triggerFlag: { fontSize: 20 },
  triggerCode: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  triggerChevron: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 20, color: colors.textPrimary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  searchContainer: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemFlag: { fontSize: 24, marginRight: 12 },
  itemName: { flex: 1, fontSize: 16, color: colors.textPrimary },
  itemCode: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  separator: { height: 1, backgroundColor: colors.divider },
});

export default CountryPickerModal;
