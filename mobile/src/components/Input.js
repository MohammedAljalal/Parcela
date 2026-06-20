import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

/**
 * Reusable Input component.
 *
 * Props:
 *   label         - string   Label shown above the field
 *   value         - string   Controlled value
 *   onChangeText  - func     Change handler
 *   placeholder   - string
 *   keyboardType  - string   e.g. 'phone-pad', 'email-address'
 *   secureText    - bool     Password masking toggle
 *   leftSlot      - node     Element rendered left of the text field
 *   rightSlot     - node     Element rendered right of the text field
 *   error         - string   Error message below field
 *   autoCapitalize- string
 *   editable      - bool
 */
const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureText = false,
  leftSlot,
  rightSlot,
  error,
  autoCapitalize = 'none',
  editable = true,
}) => {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureText);

  const borderColor = error
    ? '#EF4444'
    : focused
    ? colors.borderActive
    : colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.container, { borderColor }]}>
        {/* Left slot (e.g. country picker) */}
        {leftSlot ? (
          <View style={styles.leftSlot}>{leftSlot}</View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            leftSlot && styles.inputWithLeft,
            rightSlot && styles.inputWithRight,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* Right slot — show/hide password eye icon */}
        {secureText ? (
          <TouchableOpacity
            style={styles.rightSlot}
            onPress={() => setSecure((s) => !s)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.eyeIcon, { opacity: secure ? 0.5 : 1 }]}>👁️</Text>
          </TouchableOpacity>
        ) : rightSlot ? (
          <View style={styles.rightSlot}>{rightSlot}</View>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: spacing.radiusMd,
    // iOS shadow
    shadowColor: colors.shadowNeutral,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    // Android
    elevation: 1,
  },
  leftSlot: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  rightSlot: {
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    letterSpacing: 0.1,
  },
  inputWithLeft: {
    paddingLeft: spacing.md,
  },
  inputWithRight: {
    paddingRight: spacing.sm,
  },
  eyeIcon: {
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input;
