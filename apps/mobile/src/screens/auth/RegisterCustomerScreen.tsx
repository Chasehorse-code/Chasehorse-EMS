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

interface RegisterCustomerScreenProps {
  onBackToLogin: () => void;
}

export const RegisterCustomerScreen: React.FC<RegisterCustomerScreenProps> = ({ onBackToLogin }) => {
  const { registerCustomer } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [region, setRegion] = useState('Tenali Urban, Andhra Pradesh');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!companyName.trim() || !contactPerson.trim() || !email.trim() || !phone.trim() || !gstin.trim()) {
      Alert.alert('Required Fields', 'Please fill in all corporate details including verified GSTIN.');
      return;
    }

    setLoading(true);
    try {
      await registerCustomer({
        companyName,
        contactPerson,
        email,
        phone,
        gstin,
        region,
      });
      Alert.alert('Customer Account Activated', `Welcome to ChaseHorse, ${companyName}!`);
    } catch {
      Alert.alert('Error', 'Failed to register customer account.');
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
        <Text style={styles.title}>Customer Registration</Text>
        <Text style={styles.subtitle}>
          Create and track field tasks across pan-India retail and logistics networks.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Corporate Entity Name *</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Apex Retail Brands Pvt Ltd"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Authorized Contact Person *</Text>
          <TextInput
            style={styles.input}
            value={contactPerson}
            onChangeText={setContactPerson}
            placeholder="e.g. Rahul Kumar (Operations Lead)"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Corporate Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="rahul.kumar@apexretail.com"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91 99000 12345"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GSTIN Registration Number *</Text>
          <TextInput
            style={styles.input}
            value={gstin}
            onChangeText={setGstin}
            autoCapitalize="characters"
            placeholder="37AAACA1234F1Z8"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Primary Operating Cluster *</Text>
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="Tenali Urban, Andhra Pradesh"
            placeholderTextColor={colors.textLightMuted}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Activating...' : 'Create Customer Account →'}</Text>
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
  submitBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
