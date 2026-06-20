import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

/**
 * Underline tab switcher — matches the TELEFONE / EMAIL design.
 *
 * Props:
 *   tabs      - Array<{ key: string, label: string }>
 *   active    - string  Currently active tab key
 *   onChange  - func    Called with the new tab key
 */
const TabSwitch = ({ tabs = [], active, onChange }) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {/* Active underline indicator */}
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.xxl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.md,
    position: 'relative',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.1,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.primary,
  },
  indicator: {
    position: 'absolute',
    bottom: -1,          // sits on top of the container border
    left: '15%',
    right: '15%',
    height: 2.5,
    borderRadius: spacing.radiusFull,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});

export default TabSwitch;
