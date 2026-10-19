import React, { useState } from 'react';
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
import { CameraHUD } from '../../components/camera/CameraHUD';
import { mobileApi } from '../../api/restApi';
import type { Task, TaskChecklistItem } from '../../types';

interface ActiveTaskScreenProps {
  task: Task | null;
  onTaskCompleted: () => void;
  onNavigateToNearby: () => void;
}

export const ActiveTaskScreen: React.FC<ActiveTaskScreenProps> = ({
  task,
  onTaskCompleted,
  onNavigateToNearby,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [evidenceCaptured, setEvidenceCaptured] = useState<{
    lat: number;
    lng: number;
    timestamp: string;
    aiScore: string;
  } | null>(null);

  // Default checklist if not provided
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>(
    task?.checklist || [
      { id: '1', label: 'Verify storefront presence & street sign', done: true, requiresPhoto: true },
      { id: '2', label: 'Inspect promotional discount standee & vinyl condition', done: true, requiresPhoto: true },
      { id: '3', label: 'Confirm zero competitor sticker overlap', done: false, requiresPhoto: false },
    ],
  );

  if (!task) {
    return (
      <View style={styles.container}>
        <Header title="Active Task Execution" />
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📋</Text>
          <Text style={styles.emptyTitle}>No Active Assignment</Text>
          <Text style={styles.emptyDesc}>
            Accept a nearby field task from your dispatch queue to start checklist execution.
          </Text>
          <TouchableOpacity style={styles.findBtn} onPress={onNavigateToNearby}>
            <Text style={styles.findBtnText}>Browse Nearby Tasks →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCheck = (id: string) => {
    setChecklist(
      checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    );
  };

  const completedCount = checklist.filter((c) => c.done).length;
  const allCompleted = completedCount === checklist.length;

  const handleSubmit = async () => {
    if (!allCompleted) {
      Alert.alert('Incomplete Checklist', 'Please complete all required field verification items before submitting.');
      return;
    }

    if (!evidenceCaptured) {
      Alert.alert('Photo Evidence Required', 'Please use the Camera HUD to capture geo-tagged photographic evidence.');
      return;
    }

    const res = await mobileApi.submitEvidence(task.id, 'Storefront photo with stamped GPS watermark');
    Alert.alert(
      'Evidence Submitted for Operations Review',
      `Gemini AI Verification: ${res.aiResult}\n\nTask bounty of ₹${task.rewardInr} has been staged in your wallet under PENDING APPROVAL. Reward credits once Operations Manager approves.`,
    );
    onTaskCompleted();
  };

  return (
    <View style={styles.container}>
      <Header title="Active Task Execution" subtitle={`Reference: ${task.id}`} />

      {showCamera && (
        <CameraHUD
          taskId={task.id}
          taskTitle={task.title}
          onEvidenceCaptured={(meta) => {
            setEvidenceCaptured(meta);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Task Overview Card */}
        <View style={styles.taskCard}>
          <View style={styles.topRow}>
            <Text style={styles.categoryText}>{task.category}</Text>
            <Badge status={task.status} label={task.status.replace('_', ' ')} />
          </View>

          <Text style={styles.titleText}>{task.title}</Text>
          <Text style={styles.descText}>{task.description}</Text>

          <View style={styles.metaBox}>
            <Text style={styles.metaLine}>📍 Location: {task.location.address}</Text>
            <Text style={styles.metaLine}>💰 Reward Bounty: ₹{task.rewardInr}</Text>
            <Text style={styles.metaLine}>🕒 Deadline: Today, 06:00 PM</Text>
          </View>
        </View>

        {/* Dynamic Checklist Card */}
        <View style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <Text style={styles.sectionTitle}>MANDATORY FIELD CHECKLIST</Text>
            <Text style={styles.progressCounter}>
              {completedCount} of {checklist.length} Completed
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedCount / checklist.length) * 100}%` },
              ]}
            />
          </View>

          {checklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.checkItemRow, item.done && styles.checkItemRowDone]}
              onPress={() => toggleCheck(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                {item.done && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>
                  {item.label}
                </Text>
                {item.requiresPhoto && (
                  <Text style={styles.photoTag}>📷 Requires Geo-Tagged Photo</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Evidence Capture Card */}
        <View style={styles.evidenceCard}>
          <Text style={styles.sectionTitle}>PHOTO EVIDENCE & GEMINI AI CHECK</Text>

          {evidenceCaptured ? (
            <View style={styles.evidenceCapturedBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ color: colors.success, fontSize: 16 }}>✓</Text>
                <Text style={styles.evidenceTitle}>Geo-Tagged Image Staged & Watermarked</Text>
              </View>
              <Text style={styles.evidenceMeta}>📍 GPS Fix: {evidenceCaptured.lat}° N, {evidenceCaptured.lng}° E</Text>
              <Text style={styles.evidenceMeta}>🕒 Stamped: {evidenceCaptured.timestamp}</Text>
              <Text style={styles.evidenceAi}>{evidenceCaptured.aiScore}</Text>

              <TouchableOpacity style={styles.retakeEvidenceBtn} onPress={() => setShowCamera(true)}>
                <Text style={styles.retakeEvidenceText}>Retake Photo Staging</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraLaunchBtn} onPress={() => setShowCamera(true)}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📷</Text>
              <Text style={styles.cameraLaunchText}>Open Camera HUD & Capture Stamped Proof</Text>
              <Text style={styles.cameraLaunchSub}>Burns GPS reticles, timestamp & task ID</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Execution Action */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Evidence to Operations →</Text>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDesc: {
    color: colors.textLightMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  findBtn: {
    backgroundColor: colors.bluePrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  findBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  taskCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  titleText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  descText: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  metaBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  metaLine: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.textLightMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressCounter: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceDark,
    borderRadius: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  checkItemRowDone: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkLabel: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 16,
  },
  checkLabelDone: {
    color: colors.textLightMuted,
    textDecorationLine: 'line-through',
  },
  photoTag: {
    color: '#FBBF24',
    fontSize: 10,
    marginTop: 2,
  },
  evidenceCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cameraLaunchBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.blueAccent,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  cameraLaunchText: {
    color: colors.blueAccent,
    fontWeight: '700',
    fontSize: 13,
  },
  cameraLaunchSub: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  evidenceCapturedBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  evidenceTitle: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  evidenceMeta: {
    color: colors.textLightMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  evidenceAi: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  retakeEvidenceBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  retakeEvidenceText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
