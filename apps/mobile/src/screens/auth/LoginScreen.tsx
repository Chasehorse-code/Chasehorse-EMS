import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  const { login, verifyOtp, resendOtp, signInWithOtp, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState<Role>('customer');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpType, setOtpType] = useState<'signup' | 'email'>('signup');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSignIn = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered corporate email.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedEmail, password, targetRole);
      if (res.requiresOtp) {
        setOtpRequired(true);
        setOtpType('signup');
        setCooldown(60);
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
      if (err?.code === 'EMAIL_NOT_CONFIRMED' || msg.toLowerCase().includes('email not confirmed')) {
        setOtpRequired(true);
        setOtpType('signup');
        setCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpLogin = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await signInWithOtp(trimmedEmail);
    setLoading(false);

    if (res.success) {
      setOtpRequired(true);
      setOtpType('email');
      setCooldown(60);
      Alert.alert(
        'Security Code Sent',
        `A 6-digit verification code has been dispatched to ${trimmedEmail}.`,
      );
    } else {
      setErrorMessage(res.error || 'Failed to dispatch security code.');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    const trimmedOtp = otp.trim();

    if (trimmedOtp.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification security code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(email.trim(), trimmedOtp, otpType);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid or expired verification code. Please request a new one.');
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMessage('');
    setLoading(true);
    const res = await resendOtp(email.trim(), otpType);
    setLoading(false);

    if (res.success) {
      setCooldown(60);
      Alert.alert('Code Dispatched', `A fresh verification code was sent to ${email.trim()}.`);
    } else {
      setErrorMessage(res.error || 'Failed to resend verification code.');
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      Alert.alert('Email Required', 'Please enter your corporate email address above first.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(trimmedEmail);
    setLoading(false);

    if (res.success) {
      Alert.alert(
        'Password Reset Sent',
        `If an account exists for ${trimmedEmail}, password recovery instructions have been dispatched.`,
      );
    } else {
      Alert.alert('Request Failed', res.error || 'Unable to send password recovery instructions.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
              setErrorMessage('');
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
              setErrorMessage('');
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
              setErrorMessage('');
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
              ? 'Security Verification'
              : targetRole === 'customer'
              ? 'Customer Portal Access'
              : targetRole === 'employee'
              ? 'Field Worker Access'
              : 'Operations Management'}
          </Text>
          <Text style={styles.cardDesc}>
            {otpRequired
              ? `Enter the 6-digit verification code sent to ${email.trim()}`
              : 'Sign in to access real-time dispatch, task tracking, and verified ledger.'}
          </Text>

          {/* Inline Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!otpRequired ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Corporate Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="name@company.com"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.label}>Password *</Text>
                  <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                    <Text style={styles.forgotPasswordText}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    Sign In to Portal →
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryOptionBtn}
                onPress={handleSendOtpLogin}
                disabled={loading}
              >
                <Text style={styles.secondaryOptionText}>
                  Send One-Time Email Code Instead
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit Security Code *</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val.replace(/[^0-9]/g, ''));
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Confirm Code & Sign In ✓</Text>
                )}
              </TouchableOpacity>

              <View style={styles.otpActionRow}>
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleResendOtp}
                  disabled={loading || cooldown > 0}
                >
                  <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
                    {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelOtpBtn}
                  onPress={() => {
                    setOtpRequired(false);
                    setErrorMessage('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelOtpText}>← Back to Password</Text>
                </TouchableOpacity>
              </View>
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
    </KeyboardAvoidingView>
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
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: colors.textLightMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  forgotPasswordText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    color: colors.textLight,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryOptionBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  secondaryOptionText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resendBtn: {
    paddingVertical: 8,
  },
  resendText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  resendDisabled: {
    color: colors.textLightMuted,
  },
  cancelOtpBtn: {
    paddingVertical: 8,
  },
  cancelOtpText: {
    color: colors.textLightMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  regSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  regPrompt: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  regLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkBtn: {
    paddingVertical: 4,
  },
  linkText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  bullet: {
    color: colors.textLightMuted,
  },
});
