import React, { useState, useEffect } from 'react';
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
import { mobileApi } from '../../api/restApi';
import { useAuth } from '../../context/AuthContext';
import type { WalletTransaction } from '../../types';

export const WalletScreen: React.FC = () => {
  const { user } = useAuth();
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      mobileApi
        .getWalletTransactions(user.id)
        .then((data) => setTxns(data || []))
        .catch(() => setTxns([]))
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  const completedTotal = txns
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTotal = txns
    .filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleWithdraw = () => {
    Alert.alert(
      'Wallet Payout Request',
      `Available Balance: ₹${completedTotal}\n\nIn accordance with ERP blueprint policies, automated payout settlement processes weekly to your verified UPI/bank account on Mondays at 10:00 AM.`,
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Worker Wallet & Ledger" subtitle="Immutable Reward Accounting & Operations Approvals" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balances Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceVal}>₹{completedTotal}</Text>
              <Text style={styles.balanceSub}>Verified & ready for weekly settlement</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
              <Text style={styles.withdrawText}>Payout Info</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pendingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingLabel}>Pending Manager Review</Text>
              <Text style={styles.pendingDesc}>Tasks submitted with AI pass; awaiting Ops sign-off</Text>
            </View>
            <Text style={styles.pendingVal}>₹{pendingTotal}</Text>
          </View>
        </View>

        {/* Ledger Transactions */}
        <Text style={styles.sectionHeading}>TRANSACTION AUDIT LEDGER</Text>

        {txns.map((t) => (
          <View key={t.id} style={styles.txnCard}>
            <View style={styles.txnTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnTitle}>{t.description}</Text>
                <Text style={styles.txnDate}>{t.createdAt}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.txnAmount,
                    t.status === 'COMPLETED' ? { color: colors.success } : { color: colors.warning },
                  ]}
                >
                  {t.status === 'COMPLETED' ? `+₹${t.amount}` : `₹${t.amount}`}
                </Text>
                <Text
                  style={[
                    styles.statusTag,
                    t.status === 'COMPLETED' ? styles.statusCompleted : styles.statusPending,
                  ]}
                >
                  {t.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
  balanceCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  balanceLabel: {
    color: colors.blueAccent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  balanceVal: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  balanceSub: {
    color: colors.textLightMuted,
    fontSize: 10,
  },
  withdrawBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: colors.blueAccent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  withdrawText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  pendingLabel: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingDesc: {
    color: colors.textLightMuted,
    fontSize: 10,
    marginTop: 2,
  },
  pendingVal: {
    color: '#FBBF24',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeading: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  txnCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  txnTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  txnTitle: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  txnDate: {
    color: colors.textLightMuted,
    fontSize: 10,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusTag: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  statusCompleted: {
    color: colors.success,
  },
  statusPending: {
    color: colors.warning,
  },
});
