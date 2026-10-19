import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';

export const CustomerProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Required', 'Please enter a ticket subject and description.');
      return;
    }
    setTicketSubmitted(true);
    Alert.alert(
      'Support Ticket Created',
      `Ticket reference #TKT-${Math.floor(1000 + Math.random() * 9000)} has been queued. Our dedicated account team will respond within 2 business hours.`,
    );
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <View style={styles.container}>
      <Header title="Customer Profile & Support" subtitle="Corporate Account Management & 24/7 Operations Desk" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Company Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{user?.companyName || 'Apex Retail Brands Pvt Ltd'}</Text>
              <Text style={styles.roleSub}>Corporate Client Account • Verified</Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Authorized Contact</Text>
            <Text style={styles.infoVal}>{user?.displayName || 'Rahul Kumar'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Email</Text>
            <Text style={styles.infoVal}>{user?.email || 'rahul.kumar@apexretail.com'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Contact</Text>
            <Text style={styles.infoVal}>{user?.phone || '+91 99000 12345'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verified GSTIN</Text>
            <Text style={[styles.infoVal, { fontFamily: 'monospace', color: colors.blueAccent }]}>
              {user?.gstin || '37AAACA1234F1Z8'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Operating Cluster</Text>
            <Text style={styles.infoVal}>{user?.region || 'Tenali Urban, Andhra Pradesh'}</Text>
          </View>
        </View>

        {/* 24/7 Operations Help Desk */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>24/7 Enterprise Help Desk</Text>
          <Text style={styles.sectionDesc}>Direct escalation to ChaseHorse Operations Center.</Text>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>📞</Text>
            <View>
              <Text style={styles.contactTitle}>Emergency Operations Hotline</Text>
              <Text style={styles.contactDetail}>1800-419-8800 (Toll-Free Pan-India)</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>✉️</Text>
            <View>
              <Text style={styles.contactTitle}>Enterprise Support Email</Text>
              <Text style={styles.contactDetail}>support@chasehorse.com</Text>
            </View>
          </View>
        </View>

        {/* Ticket Creation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Submit Priority Ticket</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={ticketSubject}
              onChangeText={setTicketSubject}
              placeholder="e.g. Inquire about cluster expansion or billing"
              placeholderTextColor={colors.textLightMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detailed Description</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={ticketMessage}
              onChangeText={setTicketMessage}
              multiline
              placeholder="Describe your request or task adjustment requirement..."
              placeholderTextColor={colors.textLightMuted}
            />
          </View>

          <TouchableOpacity style={styles.ticketBtn} onPress={handleSubmitTicket}>
            <Text style={styles.ticketBtnText}>Submit Priority Ticket →</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutCardBtn} onPress={signOut}>
          <Text style={styles.signOutCardText}>Sign Out of Corporate Account</Text>
        </TouchableOpacity>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  companyName: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  roleSub: {
    color: colors.blueAccent,
    fontSize: 11,
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  infoLabel: {
    color: colors.textLightMuted,
    fontSize: 12,
  },
  infoVal: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionDesc: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceDark,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  contactIcon: {
    fontSize: 20,
  },
  contactTitle: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  contactDetail: {
    color: colors.blueAccent,
    fontSize: 11,
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    color: colors.textLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
  },
  ticketBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ticketBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutCardBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutCardText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 13,
  },
});
