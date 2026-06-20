import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

/**
 * Language selection card.
 *
 * Props:
 *   flag       - string  Emoji flag (e.g. "🇵🇹")
 *   label      - string  Language name (e.g. "Português")
 *   isActive   - bool    Whether this language is currently selected
 *   onPress    - func    Selection handler
 */
const LanguageCard = ({ flag, label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Flag */}
      <Text style={styles.flag}>{flag}</Text>

      {/* Language name */}
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>

      {/* Checkmark badge — only shown when active */}
      {isActive && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    // Shadow — iOS
    shadowColor: colors.shadowNeutral,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Shadow — Android
    elevation: 2,
  },
  cardActive: {
    borderColor: colors.borderActive,
    backgroundColor: colors.primaryLight,
    // Slightly stronger shadow when selected
    shadowOpacity: 0.14,
    elevation: 4,
  },
  flag: {
    fontSize: 26,
    marginRight: spacing.lg,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
});

export default LanguageCard;
