import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export const PendingApprovalScreen: React.FC = () => {
  const { user, signOut, checkApprovalStatus } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await checkApprovalStatus();
      if (res.approved) {
        Alert.alert(
          'Account Approved!',
          'Your worker profile has been approved by Operations. Welcome to ChaseHorse Field Operations!',
        );
      } else if (res.status === 'rejected') {
        Alert.alert(
          'Application Status: Rejected',
          'Your registration was reviewed and not approved by Operations. Please contact support.',
        );
      } else {
        Alert.alert(
          'Status: Pending Review',
          'Your account is still awaiting review by an Operations Manager. We appreciate your patience.',
        );
      }
    } catch {
      Alert.alert('Network Issue', 'Could not sync latest approval status with the server.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⏳</Text>
        </View>

        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.desc}>
          Thank you for registering with ChaseHorse Field Operations.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoRow}>👤 Applicant: {user?.displayName}</Text>
          <Text style={styles.infoRow}>📧 Email: {user?.email}</Text>
          <Text style={styles.infoRow}>📍 Cluster: {user?.region || 'Tenali Urban'}</Text>
          <Text style={styles.infoRow}>🛡️ Status: PENDING OPS REVIEW</Text>
        </View>

        <Text style={styles.policyText}>
          In compliance with the ERP blueprint, on-field workers must be verified by an Operations Manager before accepting paid field assignments or accessing the wallet ledger.
        </Text>

        <TouchableOpacity
          style={[styles.checkBtn, checking && styles.btnDisabled]}
          onPress={handleCheckStatus}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.checkText}>Check Approval Status 🔄</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  desc: {
    color: colors.textLightMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
  },
  infoRow: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  policyText: {
    color: '#FBBF24',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  checkBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
