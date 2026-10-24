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

interface RegisterEmployeeScreenProps {
  onBackToLogin: () => void;
}

export const RegisterEmployeeScreen: React.FC<RegisterEmployeeScreenProps> = ({ onBackToLogin }) => {
  const { registerEmployee, verifyOtp, resendOtp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('Tenali Urban, Andhra Pradesh');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
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

  const handleExtractGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoadingGps(false);
          setGpsCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          Alert.alert(
            'Device Location Verified',
            `Acquired coordinates:\n${pos.coords.latitude.toFixed(5)}° N, ${pos.coords.longitude.toFixed(5)}° E`,
          );
        },
        () => {
          setLoadingGps(false);
          // Set default cluster fallback
          setGpsCoordinates({ lat: 16.2418, lng: 80.6448 });
          Alert.alert('Location Notice', 'Could not obtain hardware GPS fix. Using default Tenali cluster coordinates.');
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setGpsCoordinates({ lat: 16.2418, lng: 80.6448 });
      Alert.alert('Location Notice', 'Geolocation hardware unavailable on this platform. Assigned to default operational cluster.');
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      setErrorMessage('Please enter a valid mobile telephone number.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerEmployee({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        region: region.trim() || 'Tenali Urban, Andhra Pradesh',
        subRole: 'on_field',
        coords: gpsCoordinates || { lat: 16.2418, lng: 80.6448 },
        password,
      });

      if (res.needsEmailVerification) {
        setRegisteredEmail(trimmedEmail);
        setShowOtpStep(true);
        setCooldown(60);
      } else {
        Alert.alert(
          'Registration Submitted',
          'Your field employee registration has been submitted and is currently pending Operations Manager review.',
        );
        onBackToLogin();
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit registration.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'An account with this email address is already registered. Please sign in instead.',
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
        'Email Confirmed & Application Submitted',
        'Your email address has been verified! In accordance with ERP security blueprint, your worker account is in quarantine awaiting Operations Manager approval.',
      );
      onBackToLogin();
    } else {
      setErrorMessage(res.error || 'Verification code invalid or expired.');
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
              <Text style={styles.title}>Field Worker Registration</Text>
              <Text style={styles.subtitle}>
                Join the ChaseHorse pan-India on-field workforce network.
              </Text>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Legal Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Corporate / Personal Email *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="ramesh.kumar@fieldworker.in"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="phone-pad"
                  placeholder="+91 98480 12345"
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
                <Text style={styles.label}>Assigned District / Cluster *</Text>
                <TextInput
                  style={styles.input}
                  value={region}
                  onChangeText={setRegion}
                  placeholder="Tenali Urban, Andhra Pradesh"
                  placeholderTextColor={colors.textLightMuted}
                  editable={!loading}
                />
              </View>

              {/* GPS Extraction */}
              <View style={styles.gpsCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsLabel}>Device Operational Geolocation</Text>
                  <Text style={styles.gpsVal}>
                    {gpsCoordinates
                      ? `📍 ${gpsCoordinates.lat.toFixed(5)}° N, ${gpsCoordinates.lng.toFixed(5)}° E (±4m)`
                      : 'Click button to capture current GPS coordinates'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.gpsBtn} onPress={handleExtractGps} disabled={loadingGps}>
                  <Text style={styles.gpsBtnText}>{loadingGps ? 'Syncing...' : 'Extract GPS'}</Text>
                </TouchableOpacity>
              </View>

              {/* Pending Approval Notice */}
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  ℹ️ In accordance with ERP blueprint security, all field workers start in Pending Approval status until identity and qualifications are verified by an Operations Manager.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Submit Field Registration →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Confirm Email Security Code</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit confirmation code to {registeredEmail}. Please enter it below to complete registration.
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
                  <Text style={styles.submitText}>Confirm Code & Submit ✓</Text>
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
  gpsCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gpsLabel: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  gpsVal: {
    color: colors.blueAccent,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gpsBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.blueAccent,
  },
  gpsBtnText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    color: '#FBBF24',
    fontSize: 11,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
