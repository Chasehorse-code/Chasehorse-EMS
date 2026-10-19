import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { mobileApi } from '../../api/restApi';
import { useAuth } from '../../context/AuthContext';
import type { DashboardStats } from '../../types';

interface Props {
  onNavigateToReview?: () => void;
  onNavigateToApprovals?: () => void;
  onNavigateToDirectory?: () => void;
}

export const AdminDashboardScreen: React.FC<Props> = ({
  onNavigateToReview,
  onNavigateToApprovals,
  onNavigateToDirectory,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await mobileApi.getDashboardStats(user?.token);
      setStats(data);
    } catch (err) {
      console.warn('[AdminDashboard] Failed to fetch server stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <View style={styles.container}>
      <Header
        title="Admin Command Center"
        subtitle="Enterprise System Metrics & Governance Overview"
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.blueAccent} />
          <Text style={styles.loadingText}>Fetching enterprise metrics...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.blueAccent}
            />
          }
        >
          {/* Quick Notice Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerIcon}>👑</Text>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.bannerTitle}>Administrator Console</Text>
              <Text style={styles.bannerSub}>
                Real-time tenant analytics derived directly from database source of truth.
              </Text>
            </View>
          </View>

          {/* Core Metric Cards */}
          <Text style={styles.sectionHeader}>Task Lifecycle Metrics</Text>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Tasks</Text>
              <Text style={styles.statValue}>{stats?.totalTasks ?? 0}</Text>
              <Text style={styles.statHint}>Across all clients</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Open & Available</Text>
              <Text style={[styles.statValue, { color: colors.blueAccent }]}>
                {stats?.openTasks ?? 0}
              </Text>
              <Text style={styles.statHint}>Ready for acceptance</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>In Progress</Text>
              <Text style={[styles.statValue, { color: '#FBBF24' }]}>
                {stats?.inProgress ?? 0}
              </Text>
              <Text style={styles.statHint}>Field execution</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Awaiting Review</Text>
              <Text style={[styles.statValue, { color: '#F87171' }]}>
                {stats?.awaitingReview ?? 0}
              </Text>
              <Text style={styles.statHint}>Pending sign-off</Text>
            </View>
          </View>

          {/* Workforce Governance */}
          <Text style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
            Workforce & Identity
          </Text>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active Field Workers</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {stats?.activeEmployees ?? 0}
              </Text>
              <Text style={styles.statHint}>Verified accounts</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending Approvals</Text>
              <Text style={[styles.statValue, { color: '#FBBF24' }]}>
                {stats?.pendingEmployeeApprovals ?? 0}
              </Text>
              <Text style={styles.statHint}>Quarantined registrations</Text>
            </View>
          </View>

          {/* Quick Management Shortcuts */}
          <Text style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
            Administrative Actions
          </Text>
          <View style={styles.actionList}>
            {onNavigateToReview && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={onNavigateToReview}
              >
                <View style={styles.actionIconBox}>
                  <Text style={styles.actionIcon}>📋</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.actionTitle}>Operations Review Queue</Text>
                  <Text style={styles.actionSub}>
                    Audit submitted task evidence and dispatch rewards
                  </Text>
                </View>
                <Badge
                  label={`${stats?.awaitingReview ?? 0} Pending`}
                  tone={stats?.awaitingReview ? 'warning' : 'neutral'}
                />
              </TouchableOpacity>
            )}

            {onNavigateToApprovals && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={onNavigateToApprovals}
              >
                <View style={styles.actionIconBox}>
                  <Text style={styles.actionIcon}>🛡️</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.actionTitle}>Worker Account Approvals</Text>
                  <Text style={styles.actionSub}>
                    Review identity registrations and grant employee access
                  </Text>
                </View>
                <Badge
                  label={`${stats?.pendingEmployeeApprovals ?? 0} Pending`}
                  tone={stats?.pendingEmployeeApprovals ? 'warning' : 'neutral'}
                />
              </TouchableOpacity>
            )}

            {onNavigateToDirectory && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={onNavigateToDirectory}
              >
                <View style={styles.actionIconBox}>
                  <Text style={styles.actionIcon}>👥</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.actionTitle}>Employee Directory & Roles</Text>
                  <Text style={styles.actionSub}>
                    Manage staff, regional clusters, and RBAC privileges
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textLightMuted,
    fontSize: 13,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge * 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerTitle: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerSub: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
  },
  statLabel: {
    color: colors.textLightMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: colors.textLight,
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  statHint: {
    color: colors.textLightMuted,
    fontSize: 10,
  },
  actionList: {
    gap: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  arrowIcon: {
    color: colors.blueAccent,
    fontSize: 18,
    fontWeight: '700',
  },
});
