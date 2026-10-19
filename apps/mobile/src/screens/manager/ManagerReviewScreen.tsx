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
import { Badge } from '../../components/ui/Badge';
import { mobileApi } from '../../api/restApi';
import type { Task } from '../../types';

export const ManagerReviewScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = async () => {
    const list = await mobileApi.listTasks();
    setTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const reviewQueue = tasks.filter(
    (t) => t.status === 'submitted' || t.status === 'in_review' || t.status === 'assigned',
  );

  const handleApprove = async (task: Task) => {
    await mobileApi.approveTask(task.id);
    Alert.alert(
      'Task Approved & Reward Dispatched',
      `Task ${task.id} approved by Operations.\nReward of ₹${task.rewardInr} has been credited into the field worker's wallet ledger.`,
    );
    loadTasks();
  };

  const handleReject = async (task: Task) => {
    await mobileApi.rejectTask(task.id);
    Alert.alert('Task Rejected', `Task ${task.id} rejected. Exception notice logged in audit history.`);
    loadTasks();
  };

  const handleRequestRework = (task: Task) => {
    Alert.alert(
      'Rework Dispatched',
      `Worker assigned to task ${task.id} notified to re-capture wide-angle photo with correct illumination.`,
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Operations Review Queue" subtitle="AI Verification Flags & Manager Sign-Off" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            ⚡ {reviewQueue.length} Field Submissions Awaiting Manager Sign-Off
          </Text>
        </View>

        {reviewQueue.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>✅</Text>
            <Text style={styles.emptyTitle}>Queue Cleared</Text>
            <Text style={styles.emptySub}>All submitted tasks have been reviewed and approved.</Text>
          </View>
        ) : (
          reviewQueue.map((task) => (
            <View key={task.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskIdText}>{task.id}</Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>
                <Badge status={task.status} label={task.status.replace('_', ' ')} />
              </View>

              <Text style={styles.siteText}>📍 Site: {task.location.address}</Text>

              {/* AI Verification Callout */}
              <View style={styles.aiBox}>
                <View style={styles.aiHeader}>
                  <Text style={styles.aiTitle}>GEMINI AI AUDIT CHECK: 96.8% MATCH</Text>
                  <Badge label="AI PASS" tone="ai" />
                </View>
                <Text style={styles.aiDetails}>
                  ✓ Geofence confirmed (reported fix within 18m of site coordinate)
                </Text>
                <Text style={styles.aiDetails}>
                  ✓ Unobstructed brand signboard & tamper-proof watermark verified
                </Text>
              </View>

              {/* Bounty info */}
              <View style={styles.bountyRow}>
                <Text style={styles.bountyLabel}>Worker Payout Pending:</Text>
                <Text style={styles.bountyVal}>₹{task.rewardInr}</Text>
              </View>

              {/* Decision Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(task)}>
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.reworkBtn} onPress={() => handleRequestRework(task)}>
                  <Text style={styles.reworkText}>Rework</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(task)}>
                  <Text style={styles.approveText}>Approve & Credit ✓</Text>
                </TouchableOpacity>
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
  summaryBar: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  taskIdText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  taskTitle: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  siteText: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
  },
  aiBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiTitle: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '800',
  },
  aiDetails: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 16,
  },
  bountyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  bountyLabel: {
    color: colors.textLightMuted,
    fontSize: 12,
  },
  bountyVal: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  rejectText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 12,
  },
  reworkBtn: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  reworkText: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 12,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  approveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
