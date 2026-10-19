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
import type { TruckPlan } from '../../types';

export const CustomerTransportScreen: React.FC = () => {
  const [plans, setPlans] = useState<TruckPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TruckPlan | null>(null);

  useEffect(() => {
    mobileApi.getTruckPlans().then(setPlans);
  }, []);

  const handleBook = (plan: TruckPlan) => {
    setSelectedPlan(plan);
    Alert.alert(
      'Confirm Truck Booking',
      `Vehicle Category: ${plan.name}\nCapacity: ${plan.capacity}\nBase Rate: ₹${plan.baseRateInr} (₹${plan.perKmRateInr}/km)\nAvailable Vehicles in Cluster: ${plan.availableVehicles}\n\nDispatch vehicle to your pickup site?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking ✓',
          onPress: () => {
            Alert.alert(
              'Transport Booked Successfully',
              `Booking Reference: CH-TRK-${Math.floor(1000 + Math.random() * 9000)}\nA ${plan.name} has been dispatched. Assigned driver will contact you for loading coordination.`,
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Book Logistics Transport" subtitle="Verified Commercial Fleet Plans & Transparent Rates" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {plans.map((p) => (
          <View key={p.id} style={styles.planCard}>
            <View style={styles.planTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{p.name}</Text>
                <Text style={styles.capacityText}>Payload: {p.capacity}</Text>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateBase}>₹{p.baseRateInr}</Text>
                <Text style={styles.ratePerKm}>+₹{p.perKmRateInr}/km</Text>
              </View>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specLine}>📏 Deck Dimensions: {p.dimensions}</Text>
              <Text style={styles.specLine}>📦 Best For: {p.recommendedFor}</Text>
              <Text style={styles.specLine}>🟢 Real-Time Fleet: {p.availableVehicles} vehicles in cluster</Text>
            </View>

            <TouchableOpacity style={styles.bookBtn} onPress={() => handleBook(p)}>
              <Text style={styles.bookBtnText}>Book This Vehicle →</Text>
            </TouchableOpacity>
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
  planCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  planName: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  capacityText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rateBadge: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  rateBase: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  ratePerKm: {
    color: colors.textLightMuted,
    fontSize: 10,
  },
  specBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  specLine: {
    color: colors.textLightMuted,
    fontSize: 11,
    lineHeight: 18,
  },
  bookBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
