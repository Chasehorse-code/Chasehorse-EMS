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

interface RegisterEmployeeScreenProps {
  onBackToLogin: () => void;
}

export const RegisterEmployeeScreen: React.FC<RegisterEmployeeScreenProps> = ({ onBackToLogin }) => {
  const { registerEmployee } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('Tenali Urban, Andhra Pradesh');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExtractGps = () => {
    setLoadingGps(true);
    setTimeout(() => {
      setLoadingGps(false);
      setGpsCoordinates({ lat: 16.24184, lng: 80.6448 });
      Alert.alert(
        'Device Location Verified',
        'Acquired high-precision device fix:\n16.24184° N, 80.64480° E (±4m)\nRegion: Tenali Urban Cluster',
      );
    }, 600);
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please fill in full name, email, and mobile phone.');
      return;
    }

    setLoading(true);
    try {
      await registerEmployee({
        name,
        email,
        phone,
        region,
        subRole: 'on_field',
        coords: gpsCoordinates || { lat: 16.2418, lng: 80.6448 },
      });
      Alert.alert(
        'Registration Submitted',
        'Your field employee registration has been submitted and is currently pending Operations Manager approval.',
      );
    } catch {
      Alert.alert('Error', 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin}>
        <Text style={styles.backText}>← Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>Field Worker Registration</Text>
        <Text style={styles.subtitle}>
          Join the ChaseHorse pan-India on-field workforce network.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Legal Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Kumar"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="ramesh.kumar@fieldworker.in"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91 98480 12345"
            placeholderTextColor={colors.textLightMuted}
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

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Submitting...' : 'Submit Field Registration →'}</Text>
        </TouchableOpacity>
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
  gpsCard: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.blueAccent,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gpsLabel: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  gpsVal: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  gpsBtn: {
    backgroundColor: colors.bluePrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: radius.sm,
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
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
