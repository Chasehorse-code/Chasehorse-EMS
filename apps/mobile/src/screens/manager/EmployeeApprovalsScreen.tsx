import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../types';

export const EmployeeApprovalsScreen: React.FC = () => {
  const { pendingAccounts, approveAccount, rejectAccount } = useAuth();

  const handleApprove = (account: UserProfile) => {
    approveAccount(account.id);
    Alert.alert(
      'Account Approved',
      `Employee ${account.displayName} has been approved.\nTheir status is updated to ACTIVE and they can now accept field tasks in the ${account.region || 'Tenali'} cluster.`,
    );
  };

  const handleReject = (account: UserProfile) => {
    rejectAccount(account.id);
    Alert.alert('Account Rejected', `Registration for ${account.displayName} has been rejected.`);
  };

  return (
    <View style={styles.container}>
      <Header title="Worker Account Approvals" subtitle="Operations Governance & Identity Verification" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            🛡️ {pendingAccounts.length} Pending Field Registrations Requiring Authorization
          </Text>
        </View>

        {pendingAccounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>✅</Text>
            <Text style={styles.emptyTitle}>All Registrations Reviewed</Text>
            <Text style={styles.emptySub}>No worker accounts currently waiting in quarantine.</Text>
          </View>
        ) : (
          pendingAccounts.map((account) => (
            <View key={account.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>{account.displayName.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.nameText}>{account.displayName}</Text>
                  <Text style={styles.emailText}>{account.email}</Text>
                </View>
                <View style={styles.pendingTag}>
                  <Text style={styles.pendingTagText}>PENDING</Text>
                </View>
              </View>

              <View style={styles.detailsBox}>
                <Text style={styles.detailLine}>📱 Mobile: {account.phone || 'N/A'}</Text>
                <Text style={styles.detailLine}>📍 Target Cluster: {account.region || 'Tenali Urban Cluster'}</Text>
                <Text style={styles.detailLine}>🕒 Applied: {account.createdAt}</Text>
                <Text style={styles.detailLine}>🛡️ Sub-Role: On-Field Field Worker</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(account)}>
                  <Text style={styles.rejectText}>Reject ✕</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(account)}>
                  <Text style={styles.approveText}>Approve Access ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  summaryBar: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bluePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  nameText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  emailText: {
    color: colors.textLightMuted,
    fontSize: 11,
  },
  pendingTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pendingTagText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  detailsBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  detailLine: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  rejectText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 12,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  approveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
