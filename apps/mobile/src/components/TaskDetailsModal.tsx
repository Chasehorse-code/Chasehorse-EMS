import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Badge } from './ui/Badge';
import type { Task } from '../types';

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
  onAccept?: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  onAccept,
}) => {
  if (!task) return null;

  const steps = [
    { label: 'Created', done: true, current: task.status === 'open' },
    { label: 'Assigned', done: task.status !== 'open', current: task.status === 'assigned' },
    {
      label: 'In Progress',
      done: ['in_progress', 'submitted', 'in_review', 'approved'].includes(task.status),
      current: task.status === 'in_progress',
    },
    {
      label: 'Evidence Submitted',
      done: ['submitted', 'in_review', 'approved'].includes(task.status),
      current: task.status === 'submitted' || task.status === 'in_review',
    },
    { label: 'Approved & Settled', done: task.status === 'approved', current: task.status === 'approved' },
  ];

  return (
    <Modal visible={Boolean(task)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskRefText}>{task.id}</Text>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll}>
            {/* Status & Bounty Row */}
            <View style={styles.statusBountyRow}>
              <Badge status={task.status} label={task.status.replace('_', ' ')} />
              <View style={styles.bountyPill}>
                <Text style={styles.bountyLabel}>Reward Bounty</Text>
                <Text style={styles.bountyAmount}>₹{task.rewardInr}</Text>
              </View>
            </View>

            {/* Lifecycle Timeline Track */}
            <Text style={styles.sectionHeading}>TASK LIFECYCLE TRACK</Text>
            <View style={styles.timelineBox}>
              {steps.map((s, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepDot,
                        s.done && styles.stepDotDone,
                        s.current && styles.stepDotCurrent,
                      ]}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                        {s.done ? '✓' : idx + 1}
                      </Text>
                    </View>
                    {idx < steps.length - 1 && (
                      <View style={[styles.stepLine, s.done && styles.stepLineDone]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, s.current && styles.stepLabelCurrent]}>
                      {s.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Location & Details */}
            <Text style={styles.sectionHeading}>SITE & GEOFENCE</Text>
            <View style={styles.detailsCard}>
              <Text style={styles.detailRow}>📍 Address: {task.location.address}</Text>
              <Text style={styles.detailRow}>🌐 District: {task.location.area}</Text>
              <Text style={styles.detailRow}>
                🎯 Coordinates: {task.location.lat.toFixed(4)}° N, {task.location.lng.toFixed(4)}° E
              </Text>
              <Text style={styles.detailRow}>🛡️ Geofence: ±100m Verification Radius</Text>
              <Text style={styles.detailRow}>📁 Category: {task.category}</Text>
              <Text style={styles.detailRow}>🕒 SLA Target: 24 Hours</Text>
            </View>

            {/* Objective Description */}
            <Text style={styles.sectionHeading}>OBJECTIVE</Text>
            <View style={styles.descBox}>
              <Text style={styles.descText}>{task.description}</Text>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissText}>Close</Text>
            </TouchableOpacity>

            {onAccept && (task.status === 'open' || task.status === 'assigned') && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => {
                  onAccept(task);
                  onClose();
                }}
              >
                <Text style={styles.acceptText}>Accept Assignment →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 24, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.navyDark,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderDark,
    maxHeight: '88%',
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  taskRefText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  taskTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  bodyScroll: {
    marginVertical: spacing.md,
  },
  statusBountyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bountyPill: {
    alignItems: 'flex-end',
  },
  bountyLabel: {
    color: colors.textLightMuted,
    fontSize: 10,
  },
  bountyAmount: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeading: {
    color: colors.textLightMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginVertical: spacing.xs,
  },
  timelineBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotDone: {
    backgroundColor: colors.success,
  },
  stepDotCurrent: {
    backgroundColor: colors.bluePrimary,
    borderWidth: 2,
    borderColor: colors.blueAccent,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderDark,
    marginVertical: 2,
  },
  stepLineDone: {
    backgroundColor: colors.success,
  },
  stepContent: {
    paddingLeft: spacing.sm,
    paddingBottom: spacing.sm,
  },
  stepLabel: {
    color: colors.textLightMuted,
    fontSize: 12,
  },
  stepLabelCurrent: {
    color: colors.blueAccent,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
  },
  descBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  descText: {
    color: colors.textLightMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dismissText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
