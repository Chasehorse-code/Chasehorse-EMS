import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';

export const EmployeeProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const initials = (user?.displayName || user?.email || 'SK')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Header title="Worker Profile & ID" subtitle="On-Field Credentials & Workforce Metrics" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Worker ID Card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.workerName}>{user?.displayName || 'Field Operator'}</Text>
              <Text style={styles.workerRole}>On-Field Operations Associate</Text>
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedText}>✓ VERIFIED FIELD OPERATOR</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsBox}>
            <Text style={styles.detailRow}>🆔 Employee ID: {user?.id ? `EMP-${user.id.slice(0, 8).toUpperCase()}` : 'EMP-PENDING'}</Text>
            <Text style={styles.detailRow}>📧 Email: {user?.email}</Text>
            <Text style={styles.detailRow}>📱 Mobile: {user?.phone || 'Not Provided'}</Text>
            <Text style={styles.detailRow}>📍 Cluster: {user?.region || 'National Network'}</Text>
          </View>
        </View>

        {/* Operational Status */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>OPERATIONAL COMPLIANCE</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>ACTIVE</Text>
              <Text style={styles.metricLabel}>Account State</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>VERIFIED</Text>
              <Text style={styles.metricLabel}>Identity Tier</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>ONLINE</Text>
              <Text style={styles.metricLabel}>GPS Dispatch</Text>
            </View>
          </View>
        </View>

        {/* Support Desk */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>FIELD DISPATCH HOTLINE</Text>
          <Text style={styles.supportLine}>📞 Operations Control: 1800-419-8800 (Toll-Free)</Text>
          <Text style={styles.supportLine}>🏢 Dispatch Hub: Tenali Transit Hub #2</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Sign Out of Worker Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge * 2,
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bluePrimary,
    borderWidth: 2,
    borderColor: colors.blueAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  workerName: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  workerRole: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  verifiedChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
  detailsBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  detailRow: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    color: colors.textLightMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    color: colors.blueAccent,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textLightMuted,
    fontSize: 10,
    marginTop: 2,
  },
  supportLine: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 20,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
