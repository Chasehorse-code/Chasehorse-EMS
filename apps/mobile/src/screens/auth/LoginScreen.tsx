import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface LoginScreenProps {
  onNavigateToRegisterEmployee: () => void;
  onNavigateToRegisterCustomer: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegisterEmployee,
  onNavigateToRegisterCustomer,
}) => {
  const { login, verifyOtp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState<Role>('customer');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, targetRole);
      if (res.requiresOtp) {
        setOtpRequired(true);
        Alert.alert(
          'Email OTP Sent',
          `A 6-digit verification security code has been sent to ${email}.`,
        );
      }
    } catch (err) {
      Alert.alert('Sign In Failed', 'Invalid credentials or network issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const success = await verifyOtp(email, otp);
    setLoading(false);

    if (!success) {
      Alert.alert('Verification Failed', 'Invalid or expired OTP code.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Brand Hero */}
      <View style={styles.brandHero}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoStallion}>♞</Text>
        </View>
        <Text style={styles.brandTitle}>CHASEHORSE</Text>
        <Text style={styles.brandSub}>Enterprise Logistics & Workforce Orchestration</Text>
      </View>

      {/* Role Selection Tabs */}
      <View style={styles.roleToggleRow}>
        <TouchableOpacity
          style={[styles.roleTab, targetRole === 'customer' && styles.roleTabActive]}
          onPress={() => {
            setTargetRole('customer');
            setOtpRequired(false);
          }}
        >
          <Text style={[styles.roleTabText, targetRole === 'customer' && styles.roleTabTextActive]}>
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, targetRole === 'employee' && styles.roleTabActive]}
          onPress={() => {
            setTargetRole('employee');
            setOtpRequired(false);
          }}
        >
          <Text style={[styles.roleTabText, targetRole === 'employee' && styles.roleTabTextActive]}>
            Field Worker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, targetRole === 'manager' && styles.roleTabActive]}
          onPress={() => {
            setTargetRole('manager');
            setOtpRequired(false);
          }}
        >
          <Text style={[styles.roleTabText, targetRole === 'manager' && styles.roleTabTextActive]}>
            Operations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {otpRequired
            ? 'Enter Security OTP'
            : targetRole === 'customer'
            ? 'Customer Portal Login'
            : targetRole === 'employee'
            ? 'Worker Sign-In (OTP Protected)'
            : 'Operations Manager Access'}
        </Text>
        <Text style={styles.cardDesc}>
          {otpRequired
            ? `Security code delivered to ${email}`
            : 'Access authenticated field orchestration resources.'}
        </Text>

        {!otpRequired ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Corporate Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@company.com"
                placeholderTextColor={colors.textLightMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textLightMuted}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} disabled={loading}>
              <Text style={styles.primaryBtnText}>
                {loading
                  ? 'Verifying...'
                  : targetRole === 'employee'
                  ? 'Send Security OTP →'
                  : 'Sign In to Portal →'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>6-Digit Security Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={colors.textLightMuted}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? 'Authenticating...' : 'Confirm OTP & Sign In ✓'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelOtpBtn} onPress={() => setOtpRequired(false)}>
              <Text style={styles.cancelOtpText}>← Back to Email Sign-In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Registration Links */}
      <View style={styles.regSection}>
        <Text style={styles.regPrompt}>Need an account?</Text>
        <View style={styles.regLinksRow}>
          <TouchableOpacity style={styles.linkBtn} onPress={onNavigateToRegisterEmployee}>
            <Text style={styles.linkText}>Register as Field Worker</Text>
          </TouchableOpacity>
          <Text style={styles.bullet}>•</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={onNavigateToRegisterCustomer}>
            <Text style={styles.linkText}>Register as Customer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.navyDeep,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bluePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.blueAccent,
    shadowColor: colors.blueAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoStallion: {
    color: '#FFFFFF',
    fontSize: 36,
  },
  brandTitle: {
    color: colors.textLight,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandSub: {
    color: colors.textLightMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  roleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  roleTabActive: {
    backgroundColor: colors.bluePrimary,
  },
  roleTabText: {
    color: colors.textLightMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: colors.textLight,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
  },
  cardTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    color: colors.textLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '700',
    borderColor: colors.blueAccent,
  },
  otpHelper: {
    color: colors.blueAccent,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelOtpBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  cancelOtpText: {
    color: colors.textLightMuted,
    fontSize: 12,
  },
  regSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  regPrompt: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  regLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkBtn: {},
  linkText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  bullet: {
    color: colors.textLightMuted,
  },
});
