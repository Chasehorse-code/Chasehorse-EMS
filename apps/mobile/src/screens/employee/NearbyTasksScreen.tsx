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
import { Badge } from '../../components/ui/Badge';
import { mobileApi } from '../../api/restApi';
import type { Task } from '../../types';

interface NearbyTasksScreenProps {
  onAcceptTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
}

export const NearbyTasksScreen: React.FC<NearbyTasksScreenProps> = ({
  onAcceptTask,
  onSelectTask,
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [gpsFix, setGpsFix] = useState({ lat: 16.2418, lng: 80.6448, accuracy: 4 });

  const loadTasks = async () => {
    try {
      const res = await mobileApi.listTasks(undefined, user?.token);
      setTasks(res || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTasks();
  }, [user?.token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleSyncGps = () => {
    const offset = (Math.random() - 0.5) * 0.002;
    const updated = {
      lat: 16.2418 + offset,
      lng: 80.6448 + offset,
      accuracy: Math.floor(Math.random() * 4) + 3,
    };
    setGpsFix(updated);
    Alert.alert('GPS Fix Synced', `Device coordinates:\n${updated.lat.toFixed(5)}° N, ${updated.lng.toFixed(5)}° E (±${updated.accuracy}m)\nCluster: Tenali Central`);
  };

  const handleReject = async (task: Task) => {
    try {
      await mobileApi.rejectTask(task.id);
      setTasks(tasks.filter((t) => t.id !== task.id));
      Alert.alert('Task Declined', `Task "${task.title}" has been dismissed from your nearby dispatch queue.`);
    } catch {
      Alert.alert('Action Failed', 'Could not decline task. Please check network connectivity.');
    }
  };

  const openNearbyTasks = tasks.filter(
    (t) => (t.status === 'open' || t.status === 'assigned') && (t.distanceKm ?? 1) <= radiusKm,
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blueAccent} />
        }
      >
        {/* GPS Fix Bar */}
        <View style={styles.gpsBar}>
          <View style={{ flex: 1 }}>
            <View style={styles.gpsStatusRow}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.gpsTitle}>DEVICE GPS LOCKED</Text>
            </View>
            <Text style={styles.gpsCoords}>
              📍 {gpsFix.lat.toFixed(4)}° N, {gpsFix.lng.toFixed(4)}° E (±{gpsFix.accuracy}m)
            </Text>
            <Text style={styles.gpsCluster}>Tenali Urban Cluster • Active Dispatch Region</Text>
          </View>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncGps}>
            <Text style={styles.syncBtnText}>Sync GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Radius Filter Buttons */}
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>DISCOVERY RADIUS:</Text>
          {[5, 10, 25].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusBtn, radiusKm === r && styles.radiusBtnActive]}
              onPress={() => setRadiusKm(r)}
            >
              <Text style={[styles.radiusBtnText, radiusKm === r && styles.radiusBtnTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Tasks List */}
        <Text style={styles.sectionHeading}>
          AVAILABLE FIELD ASSIGNMENTS ({openNearbyTasks.length})
        </Text>

        {loading ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.blueAccent} />
            <Text style={{ color: colors.textLightMuted, marginTop: spacing.md, fontSize: 13 }}>
              Scanning operational cluster for field assignments...
            </Text>
          </View>
        ) : openNearbyTasks.length === 0 ? (
          <View style={{ backgroundColor: colors.navyDark, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderDark, padding: spacing.xl, alignItems: 'center', marginTop: spacing.sm }}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🔍</Text>
            <Text style={{ color: colors.textLight, fontSize: 16, fontWeight: '700', marginBottom: spacing.xs }}>
              No Field Tasks Nearby
            </Text>
            <Text style={{ color: colors.textLightMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              No open tasks found within {radiusKm} km of your GPS location. Try expanding your discovery radius to 25 km or click "Sync GPS" to refresh cluster position.
            </Text>
          </View>
        ) : (
          openNearbyTasks.map((task) => (
            <View key={task.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>📍 {task.distanceKm ?? 1.5} km away</Text>
                </View>
                <Badge priority={task.priority} label={task.priority.toUpperCase()} />
              </View>

              <TouchableOpacity onPress={() => onSelectTask(task)}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDesc} numberOfLines={2}>
                  {task.description}
                </Text>
              </TouchableOpacity>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.rewardLabel}>Reward Bounty</Text>
                  <Text style={styles.rewardAmount}>₹{task.rewardInr}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => onAcceptTask(task)}>
                    <Text style={styles.acceptBtnText}>Accept Task →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleReject(task)}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  gpsBar: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gpsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  gpsTitle: {
    color: colors.blueAccent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gpsCoords: {
    color: colors.textLight,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  gpsCluster: {
    color: colors.textLightMuted,
    fontSize: 10,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: colors.blueAccent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  syncBtnText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  radiusLabel: {
    color: colors.textLightMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  radiusBtn: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  radiusBtnActive: {
    backgroundColor: colors.bluePrimary,
    borderColor: colors.blueAccent,
  },
  radiusBtnText: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  radiusBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeading: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  distanceBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  taskTitle: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  taskDesc: {
    color: colors.textLightMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  rewardLabel: {
    color: colors.textLightMuted,
    fontSize: 10,
  },
  rewardAmount: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
  },
  acceptBtn: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: colors.navyMedium,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  declineBtnText: {
    color: colors.textLightMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
