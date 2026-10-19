import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { mobileApi } from '../../api/restApi';
import { useAuth } from '../../context/AuthContext';
import type { Task, ApprovalRequestItem } from '../../types';

export const ManagerReviewScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rework Modal State
  const [reworkModalVisible, setReworkModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<{ taskId: string; approvalId?: string; title: string } | null>(null);
  const [reworkNote, setReworkNote] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const [taskList, approvalList] = await Promise.all([
        mobileApi.listTasks().catch(() => [] as Task[]),
        user?.token ? mobileApi.listApprovals(user.token).catch(() => [] as ApprovalRequestItem[]) : Promise.resolve([] as ApprovalRequestItem[]),
      ]);
      setTasks(taskList);
      setApprovals(approvalList);
    } catch (err) {
      console.warn('[ManagerReviewScreen] Failed to load review queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Find tasks that need manager review
  const reviewQueue = tasks.filter(
    (t) => t.status === 'submitted' || t.status === 'in_review',
  );

  const handleApprove = async (task: Task, approvalId?: string) => {
    setActionLoading(task.id);
    try {
      if (approvalId && user?.token) {
        await mobileApi.decideApproval(approvalId, 'APPROVED', 'Approved by Operations Manager', user.token);
      } else {
        await mobileApi.approveTask(task.id);
      }
      Alert.alert(
        'Task Approved & Reward Dispatched',
        `Task ${task.title} has been approved.\nReward of ₹${task.rewardInr} has been credited to the field worker's wallet ledger.`,
      );
      await loadData();
    } catch (err: any) {
      Alert.alert('Approval Failed', err?.message || 'Server rejected approval decision.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (task: Task, approvalId?: string) => {
    setActionLoading(task.id);
    try {
      if (approvalId && user?.token) {
        await mobileApi.decideApproval(approvalId, 'REJECTED', 'Rejected during manager quality review', user.token);
      } else {
        await mobileApi.rejectTask(task.id);
      }
      Alert.alert('Task Rejected', `Task ${task.title} has been rejected. Exception logged in audit trail.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Rejection Failed', err?.message || 'Server rejected decision.');
    } finally {
      setActionLoading(null);
    }
  };

  const openReworkModal = (task: Task, approvalId?: string) => {
    setSelectedItem({ taskId: task.id, approvalId, title: task.title });
    setReworkNote('');
    setReworkModalVisible(true);
  };

  const submitRework = async () => {
    if (!selectedItem) return;
    if (!reworkNote.trim()) {
      Alert.alert('Rework Note Required', 'Please provide explicit instructions for the field worker explaining what requires rework.');
      return;
    }

    setActionLoading(selectedItem.taskId);
    setReworkModalVisible(false);
    try {
      if (selectedItem.approvalId && user?.token) {
        await mobileApi.decideApproval(selectedItem.approvalId, 'REWORK', reworkNote.trim(), user.token);
      } else {
        // Fallback status update
        await mobileApi.updateTaskStatus(selectedItem.taskId, 'in_progress');
      }
      Alert.alert(
        'Rework Dispatched',
        `Worker reassigned to "${selectedItem.title}" with rework instructions:\n"${reworkNote.trim()}"`,
      );
      await loadData();
    } catch (err: any) {
      Alert.alert('Rework Request Failed', err?.message || 'Unable to update task status on server.');
    } finally {
      setActionLoading(null);
      setSelectedItem(null);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Operations Review Queue" subtitle="Evidence Verification & Task Sign-Off" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blueAccent} />
          <Text style={styles.loadingText}>Loading review queue from server...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blueAccent} />}
        >
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              ⚡ {reviewQueue.length} Field Submissions Awaiting Operations Sign-Off
            </Text>
          </View>

          {reviewQueue.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>✅</Text>
              <Text style={styles.emptyTitle}>Review Queue Cleared</Text>
              <Text style={styles.emptySub}>All submitted field tasks have been audited and signed off.</Text>
            </View>
          ) : (
            reviewQueue.map((task) => {
              const matchingApproval = approvals.find((a) => a.taskId === task.id);
              const isActing = actionLoading === task.id;

              return (
                <View key={task.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskIdText}>ID: {task.id.slice(0, 8)}...</Text>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                    </View>
                    <Badge status={task.status} label={task.status.replace('_', ' ').toUpperCase()} />
                  </View>

                  <Text style={styles.siteText}>📍 Site: {task.location?.address || 'Site coordinate'}</Text>
                  <Text style={styles.categoryText}>🏷️ Category: {task.category}</Text>

                  {/* Evidence & Verification State */}
                  <View style={styles.aiBox}>
                    <View style={styles.aiHeader}>
                      <Text style={styles.aiTitle}>EVIDENCE AUDIT VERIFICATION</Text>
                      <Badge label="MANUAL REVIEW" tone="neutral" />
                    </View>
                    <Text style={styles.aiDetails}>
                      • Automated AI verification service is pending cloud model configuration.
                    </Text>
                    <Text style={styles.aiDetails}>
                      • Reviewer must inspect field evidence photos, checklist completeness, and GPS stamps before sign-off.
                    </Text>
                  </View>

                  {/* Bounty info */}
                  <View style={styles.bountyRow}>
                    <Text style={styles.bountyLabel}>Worker Payout on Approval:</Text>
                    <Text style={styles.bountyVal}>₹{task.rewardInr}</Text>
                  </View>

                  {/* Decision Actions */}
                  {isActing ? (
                    <View style={styles.actionSpinner}>
                      <ActivityIndicator size="small" color={colors.blueAccent} />
                      <Text style={styles.actionSpinnerText}>Processing server decision...</Text>
                    </View>
                  ) : (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(task, matchingApproval?.id)}
                        disabled={isActing}
                      >
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reworkBtn}
                        onPress={() => openReworkModal(task, matchingApproval?.id)}
                        disabled={isActing}
                      >
                        <Text style={styles.reworkText}>Rework</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(task, matchingApproval?.id)}
                        disabled={isActing}
                      >
                        <Text style={styles.approveText}>Approve & Credit ✓</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Rework Modal */}
      <Modal
        visible={reworkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReworkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Field Rework</Text>
            <Text style={styles.modalSub}>
              Task: {selectedItem?.title}
            </Text>
            <Text style={styles.modalInstruction}>
              Explain what the field worker needs to rectify (e.g., retake photo with clear illumination, complete missing checklist item).
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Enter rework instructions for the worker..."
              placeholderTextColor={colors.textLightMuted}
              multiline
              numberOfLines={4}
              value={reworkNote}
              onChangeText={setReworkNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReworkModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={submitRework}
              >
                <Text style={styles.modalSubmitText}>Dispatch Rework</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textLightMuted,
    fontSize: 13,
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
  categoryText: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 2,
  },
  aiBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
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
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiDetails: {
    color: colors.textLightMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
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
  actionSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionSpinnerText: {
    color: colors.blueAccent,
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
  },
  modalTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: colors.blueAccent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  modalInstruction: {
    color: colors.textLightMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    color: colors.textLight,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceDark,
  },
  modalCancelText: {
    color: colors.textLightMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  modalSubmitBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warning,
  },
  modalSubmitText: {
    color: colors.navyDeep,
    fontWeight: '700',
    fontSize: 13,
  },
});

