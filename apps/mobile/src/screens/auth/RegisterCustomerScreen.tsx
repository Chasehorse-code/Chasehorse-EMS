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

interface RegisterCustomerScreenProps {
  onBackToLogin: () => void;
}

export const RegisterCustomerScreen: React.FC<RegisterCustomerScreenProps> = ({ onBackToLogin }) => {
  const { registerCustomer, verifyOtp, resendOtp } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gstin, setGstin] = useState('');
  const [region, setRegion] = useState('Tenali Urban, Andhra Pradesh');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP Verification Step
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRegister = async () => {
    setErrorMessage('');
    const trimmedCompany = companyName.trim();
    const trimmedContact = contactPerson.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedGstin = gstin.trim().toUpperCase();

    if (!trimmedCompany) {
      setErrorMessage('Please enter your corporate legal entity name.');
      return;
    }

    if (!trimmedContact) {
      setErrorMessage('Please enter the authorized contact person name.');
      return;
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid corporate email address.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      setErrorMessage('Please enter a valid business contact number.');
      return;
    }

    if (!trimmedGstin || trimmedGstin.length < 10) {
      setErrorMessage('Please enter a valid corporate GSTIN / Tax Identification Number.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Account password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCustomer({
        companyName: trimmedCompany,
        contactPerson: trimmedContact,
        email: trimmedEmail,
        phone: trimmedPhone,
        gstin: trimmedGstin,
        region: region.trim() || 'Tenali Urban, Andhra Pradesh',
        password,
      });

      if (res.needsEmailVerification) {
        setRegisteredEmail(trimmedEmail);
        setShowOtpStep(true);
        setCooldown(60);
      } else {
        Alert.alert(
          'Registration Complete',
          `Corporate account for ${trimmedCompany} has been created successfully.`,
        );
        onBackToLogin();
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to register corporate customer account.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'A customer account with this email address already exists. Please sign in.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Sign In', onPress: onBackToLogin },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit confirmation code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(registeredEmail, trimmedOtp, 'signup');
    setLoading(false);

    if (res.success) {
      Alert.alert(
        'Email Confirmed & Account Ready',
        `Corporate account verification for ${registeredEmail} succeeded! You may now sign in to orchestrate field operations.`,
      );
      onBackToLogin();
    } else {
      setErrorMessage(res.error || 'Verification code is invalid or expired.');
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMessage('');
    setLoading(true);
    const res = await resendOtp(registeredEmail, 'signup');
    setLoading(false);

    if (res.success) {
      setCooldown(60);
      Alert.alert('Code Dispatched', `A fresh confirmation code was sent to ${registeredEmail}.`);
    } else {
      setErrorMessage(res.error || 'Failed to resend confirmation code.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          {!showOtpStep ? (
            <>
              <Text style={styles.title}>Customer Registration</Text>
              <Text style={styles.subtitle}>
                Create and track field tasks across pan-India retail and logistics networks.
              </Text>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Corporate Entity Name *</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={(val) => {
                    setCompanyName(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. Apex Retail Brands Pvt Ltd"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Authorized Contact Person *</Text>
                <TextInput
                  style={styles.input}
                  value={contactPerson}
                  onChangeText={(val) => {
                    setContactPerson(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. Rahul Kumar (Operations Lead)"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Corporate Email *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="rahul.kumar@apexretail.com"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="phone-pad"
                  placeholder="+91 99000 12345"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verified Corporate GSTIN / Tax ID *</Text>
                <TextInput
                  style={[styles.input, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
                  value={gstin}
                  onChangeText={(val) => {
                    setGstin(val.toUpperCase());
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="characters"
                  placeholder="37AABCC1234F1Z5"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Password (minimum 8 characters) *</Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Operating Cluster / Region *</Text>
                <TextInput
                  style={styles.input}
                  value={region}
                  onChangeText={setRegion}
                  placeholder="Tenali Urban, Andhra Pradesh"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Submit Corporate Registration →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Confirm Email Security Code</Text>
              <Text style={styles.subtitle}>
                A 6-digit confirmation code has been delivered to {registeredEmail}. Enter it below to activate your corporate customer portal.
              </Text>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit Confirmation Code *</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otpCode}
                  onChangeText={(val) => {
                    setOtpCode(val.replace(/[^0-9]/g, ''));
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
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Confirm Code & Activate ✓</Text>
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
                  onPress={() => setShowOtpStep(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelOtpText}>← Edit Information</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  backBtn: {
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.blueAccent,
    fontSize: 13,
    fontWeight: '600',
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
  title: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
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
  label: {
    color: colors.textLightMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    color: colors.textLight,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  submitBtn: {
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
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
});
