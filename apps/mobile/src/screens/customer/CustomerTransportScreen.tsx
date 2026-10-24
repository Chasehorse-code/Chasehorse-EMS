import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';
import { mobileApi } from '../../api/restApi';
import type { TruckPlan } from '../../types';

export const CustomerTransportScreen: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<TruckPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TruckPlan | null>(null);

  const fetchPlans = async () => {
    try {
      const data = await mobileApi.getTruckPlans(user?.token);
      setPlans(data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPlans();
  }, [user?.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const handleBook = (plan: TruckPlan) => {
    setSelectedPlan(plan);
    Alert.alert(
      'Confirm Truck Booking',
      `Vehicle Category: ${plan.name}\nCapacity: ${plan.capacity}\nBase Rate: ₹${plan.baseRateInr} (₹${plan.perKmRateInr}/km)\nAvailable Vehicles in Cluster: ${plan.availableVehicles}\n\nDispatch vehicle to your pickup site?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking ✓',
          onPress: async () => {
            try {
              const booking = await mobileApi.createShipment(
                {
                  originAddress: 'Operational Hub, Tenali Cluster',
                  destinationAddress: 'Consignment Delivery Terminal',
                  cargoDescription: `${plan.name} Freight Dispatch`,
                  transportPlanId: plan.id,
                },
                user?.token
              );
              Alert.alert(
                'Transport Booked Successfully',
                `Booking Reference: ${booking.bookingRef || 'CH-TMS-CONFIRMED'}\n\nA ${plan.name} has been dispatched. Track telemetry live in the Tracking tab.`
              );
            } catch (err: any) {
              Alert.alert('Booking Error', err.message || 'Unable to register transport booking on server.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Book Logistics Transport" subtitle="Verified Commercial Fleet Plans & Transparent Rates" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blueAccent} />
        }
      >
        {loading ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.blueAccent} />
            <Text style={{ color: colors.textLightMuted, marginTop: spacing.md, fontSize: 13 }}>
              Loading commercial fleet transport plans...
            </Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={{ backgroundColor: colors.navyDark, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderDark, padding: spacing.xl, alignItems: 'center', marginTop: spacing.md }}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🚛</Text>
            <Text style={{ color: colors.textLight, fontSize: 16, fontWeight: '700', marginBottom: spacing.xs }}>
              No Active Transport Plans
            </Text>
            <Text style={{ color: colors.textLightMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              Fleet dispatch plans for your operating cluster are currently being updated by Operations. Please pull to refresh or check back shortly.
            </Text>
          </View>
        ) : (
          plans.map((p) => (
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
          ))
        )}
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
