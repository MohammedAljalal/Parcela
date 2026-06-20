import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

/**
 * Primary full-width button used on the SplashScreen and beyond.
 *
 * Props:
 *   label      - string  Button label
 *   onPress    - func    Press handler
 *   loading    - bool    Show spinner instead of label
 *   disabled   - bool    Disables touch & dims the button
 *   icon       - string  Optional character/emoji appended after label (e.g. "→")
 */
const Button = ({ label, onPress, loading = false, disabled = false, icon }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // Shadow — iOS
    shadowColor: colors.shadowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    // Shadow — Android
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  icon: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
});

export default Button;
