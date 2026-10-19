import React, { useState, useEffect } from 'react';
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
import { mobileApi } from '../../api/restApi';
import type { ShipmentMilestone } from '../../types';

interface TrackingViewData {
  id: string;
  bookingRef: string;
  status: string;
  origin: string;
  destination: string;
  cargo: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  eta: string;
  milestones: ShipmentMilestone[];
}

const DEFAULT_TRACKING: TrackingViewData = {
  id: 'CH20240512001',
  bookingRef: 'CH20240512001',
  status: 'IN_TRANSIT',
  origin: 'Vijayawada Hub A-1',
  destination: 'Guntur Distribution Hub',
  cargo: 'FMCG Packaged Goods',
  driverName: 'Rajesh Kumar',
  driverPhone: '+91 98765 43210',
  vehicleNo: 'AP 16 TE 4821',
  eta: 'Today, 18:30 IST',
  milestones: [
    { title: 'Dispatched from Hub', location: 'Vijayawada Central', time: '10:00 AM', completed: true },
    { title: 'In Transit via Highway', location: 'NH-16 En Route', time: '01:30 PM', completed: true },
    { title: 'Out for Final Delivery', location: 'Destination City Limits', time: '04:15 PM', completed: false },
  ],
};

export const CustomerTrackingScreen: React.FC = () => {
  const [query, setQuery] = useState('CH20240512001');
  const [trackingData, setTrackingData] = useState<TrackingViewData>(DEFAULT_TRACKING);

  const fetchTracking = async (ref: string) => {
    try {
      const res = await mobileApi.getTrackingInfo(ref);
      setTrackingData(res);
    } catch (err: any) {
      Alert.alert('Consignment Not Found', err?.message || 'Unable to locate tracking details for given reference.');
    }
  };

  useEffect(() => {
    fetchTracking('CH20240512001');
  }, []);

  const handleSearch = () => {
    if (!query.trim()) {
      Alert.alert('Required', 'Please enter a consignment tracking ID.');
      return;
    }
    fetchTracking(query.trim());
  };

  const handleCallDriver = () => {
    Alert.alert('Calling Logistics Driver', `Dialing ${trackingData.driverPhone} (${trackingData.driverName})...`);
  };

  return (
    <View style={styles.container}>
      <Header title="Shipment Tracking" subtitle="Real-Time Logistics Telemetry & Milestones" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Enter Consignment Tracking ID</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
              placeholder="e.g. CH20240512001"
              placeholderTextColor={colors.textLightMuted}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>Track</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consignment Status Card */}
        <View style={styles.consignmentCard}>
          <View style={styles.consignmentTopRow}>
            <Text style={styles.consignmentIdText}>{trackingData.id}</Text>
            <View style={styles.inTransitChip}>
              <Text style={styles.inTransitText}>IN TRANSIT</Text>
            </View>
          </View>

          <View style={styles.routeBox}>
            <Text style={styles.routePoint}>📍 Origin: {trackingData.origin}</Text>
            <Text style={styles.routeArrow}>↓</Text>
            <Text style={styles.routePoint}>🏁 Destination: {trackingData.destination}</Text>
          </View>

          <View style={styles.driverSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{trackingData.driverName}</Text>
              <Text style={styles.vehicleText}>Vehicle: {trackingData.vehicleNo}</Text>
              <Text style={styles.etaText}>ETA: {trackingData.eta}</Text>
            </View>
            <TouchableOpacity style={styles.callDriverBtn} onPress={handleCallDriver}>
              <Text style={styles.callDriverText}>📞 Call Driver</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestone Progression Timeline */}
        <Text style={styles.timelineHeading}>DELIVERY MILESTONES</Text>
        <View style={styles.timelineCard}>
          {trackingData.milestones.map((m, idx) => (
            <View key={idx} style={styles.milestoneRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.milestoneDot,
                    m.completed && styles.milestoneDotCompleted,
                    m.current && styles.milestoneDotCurrent,
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                    {m.completed ? '✓' : idx + 1}
                  </Text>
                </View>
                {idx < trackingData.milestones.length - 1 && (
                  <View
                    style={[
                      styles.milestoneLine,
                      m.completed && styles.milestoneLineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.milestoneContent}>
                <Text
                  style={[
                    styles.milestoneTitle,
                    m.current && { color: colors.blueAccent, fontWeight: '700' },
                  ]}
                >
                  {m.title}
                </Text>
                <Text style={styles.milestoneLocation}>{m.location}</Text>
                <Text style={styles.milestoneTime}>{m.time}</Text>
              </View>
            </View>
          ))}
        </View>
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
  searchCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  searchLabel: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    color: colors.textLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  searchBtn: {
    backgroundColor: colors.bluePrimary,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  consignmentCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  consignmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  consignmentIdText: {
    color: colors.blueAccent,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  inTransitChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  inTransitText: {
    color: colors.blueAccent,
    fontSize: 10,
    fontWeight: '700',
  },
  routeBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  routePoint: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
  },
  routeArrow: {
    color: colors.blueAccent,
    fontSize: 12,
    marginLeft: 12,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  driverName: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleText: {
    color: colors.textLightMuted,
    fontSize: 10,
    marginTop: 2,
  },
  etaText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  callDriverBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  callDriverText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineHeading: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  timelineCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
  },
  milestoneRow: {
    flexDirection: 'row',
  },
  timelineIndicatorColumn: {
    alignItems: 'center',
    width: 28,
  },
  milestoneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  milestoneDotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  milestoneDotCurrent: {
    backgroundColor: colors.bluePrimary,
    borderColor: colors.blueAccent,
  },
  milestoneLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderDark,
    marginVertical: 2,
  },
  milestoneLineCompleted: {
    backgroundColor: colors.success,
  },
  milestoneContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.lg,
  },
  milestoneTitle: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  milestoneLocation: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  milestoneTime: {
    color: colors.blueAccent,
    fontSize: 10,
    marginTop: 2,
  },
});
