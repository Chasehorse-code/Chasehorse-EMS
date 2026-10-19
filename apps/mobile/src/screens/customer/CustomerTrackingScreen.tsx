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
import { mobileApi } from '../../api/restApi';

export const CustomerTrackingScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Required', 'Please enter a consignment tracking reference.');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await mobileApi.getTrackingInfo(query.trim());
      setTrackingData(data);
    } catch {
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCallDriver = () => {
    if (trackingData?.driverPhone && trackingData.driverPhone !== 'N/A') {
      Alert.alert('Calling Logistics Driver', `Dialing ${trackingData.driverPhone} (${trackingData.driverName || 'Driver'})...`);
    } else {
      Alert.alert('Driver Contact', 'Driver contact information is not currently available for this shipment.');
    }
  };

  const events = Array.isArray(trackingData?.events) ? trackingData.events : [];

  return (
    <View style={styles.container}>
      <Header title="Shipment Tracking" subtitle="Real-Time Logistics Telemetry & Milestones" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Enter Consignment Tracking Reference</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
              placeholder="e.g. TRK-2026-001"
              placeholderTextColor={colors.textLightMuted}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
              <Text style={styles.searchBtnText}>{loading ? '...' : 'Track'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consignment Status Card */}
        {trackingData ? (
          <>
            <View style={styles.consignmentCard}>
              <View style={styles.consignmentTopRow}>
                <Text style={styles.consignmentIdText}>{trackingData.bookingRef || trackingData.id}</Text>
                <View style={styles.inTransitChip}>
                  <Text style={styles.inTransitText}>{(trackingData.status || 'IN_TRANSIT').toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.routeBox}>
                <Text style={styles.routePoint}>📍 Origin: {trackingData.originAddress || 'Origin Site'}</Text>
                <Text style={styles.routeArrow}>↓</Text>
                <Text style={styles.routePoint}>🏁 Destination: {trackingData.destinationAddress || 'Destination Site'}</Text>
              </View>

              <View style={styles.driverSection}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{trackingData.driverName || 'Assigned Driver'}</Text>
                  <Text style={styles.vehicleText}>Vehicle: {trackingData.vehicleRegistration || trackingData.vehicleType || 'Commercial Bay'}</Text>
                  <Text style={styles.etaText}>
                    ETA: {trackingData.estimatedDelivery ? new Date(trackingData.estimatedDelivery).toLocaleString() : 'In Transit'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.callDriverBtn} onPress={handleCallDriver}>
                  <Text style={styles.callDriverText}>📞 Call Driver</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Milestone Progression Timeline */}
            <Text style={styles.timelineHeading}>DELIVERY MILESTONES</Text>
            <View style={styles.timelineCard}>
              {events.length === 0 ? (
                <Text style={{ color: colors.textLightMuted, padding: spacing.md, textAlign: 'center' }}>
                  No tracking milestones logged yet.
                </Text>
              ) : (
                events.map((m: any, idx: number) => (
                  <View key={idx} style={styles.milestoneRow}>
                    <View style={styles.timelineIndicatorColumn}>
                      <View style={[styles.milestoneDot, styles.milestoneDotCompleted]}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>✓</Text>
                      </View>
                      {idx < events.length - 1 && (
                        <View style={[styles.milestoneLine, styles.milestoneLineCompleted]} />
                      )}
                    </View>

                    <View style={styles.milestoneContent}>
                      <Text style={[styles.milestoneTitle, { color: colors.blueAccent, fontWeight: '700' }]}>
                        {m.eventType || 'Event'}
                      </Text>
                      <Text style={styles.milestoneLocation}>{m.locationText || m.notes || 'In Route'}</Text>
                      <Text style={styles.milestoneTime}>
                        {m.recordedAt ? new Date(m.recordedAt).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : searched && !loading ? (
          <View style={[styles.consignmentCard, { alignItems: 'center', padding: spacing.xl }]}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🔍</Text>
            <Text style={[styles.consignmentIdText, { textAlign: 'center', marginBottom: spacing.xs }]}>
              Shipment Not Found
            </Text>
            <Text style={{ color: colors.textLightMuted, textAlign: 'center' }}>
              No active consignment matches tracking reference "{query}". Please check the ID and try again.
            </Text>
          </View>
        ) : null}
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
