import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightAction }) => {
  const { user, role, signOut } = useAuth();

  const getRoleLabel = () => {
    if (role === 'customer') return 'Customer';
    if (role === 'employee') return 'On-Field Worker';
    if (role === 'manager') return 'Operations Manager';
    return 'User';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoStallion}>♞</Text>
          </View>
          <View>
            <Text style={styles.brandName}>ChaseHorse</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{getRoleLabel()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightGroup}>
          {rightAction}
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(title || subtitle) && (
        <View style={styles.titleRow}>
          {title && <Text style={styles.headerTitle}>{title}</Text>}
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navyDark,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.bluePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blueAccent,
  },
  logoStallion: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 24,
  },
  brandName: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  roleTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  roleText: {
    color: colors.blueAccent,
    fontSize: 10,
    fontWeight: '600',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signOutBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
  },
  titleRow: {
    marginTop: spacing.sm,
  },
  headerTitle: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
