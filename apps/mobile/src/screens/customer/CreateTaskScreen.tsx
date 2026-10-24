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
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/ui/Header';
import { mobileApi } from '../../api/restApi';
import type { Task, TaskCategory, TaskPriority } from '../../types';

interface CreateTaskScreenProps {
  onBack: () => void;
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ onBack, onTaskCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Shelf audit');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [description, setDescription] = useState('');

  // Step 2: Location
  const [area, setArea] = useState('Tenali Urban, Andhra Pradesh');
  const [address, setAddress] = useState('Market Road Commercial Complex');
  const [radiusMeters, setRadiusMeters] = useState('100');

  // Step 3: Reward
  const [rewardInr, setRewardInr] = useState('450');

  // Step 4: Checklist & Templates
  const [templates, setTemplates] = useState<{ id: string; name: string; category: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [checklist, setChecklist] = useState<string[]>([
    'Verify storefront or physical facility presence',
    'Capture unobstructed wide-angle photo of asset/signage',
    'Confirm serial number / QR tag condition',
    'Record timestamp and ambient observations',
  ]);
  const [newItemText, setNewItemText] = useState('');

  // Step 5: Submission state
  const [loading, setLoading] = useState(false);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  React.useEffect(() => {
    mobileApi.listChecklistTemplates(user?.token).then((res) => {
      if (res && res.length > 0) {
        setTemplates(res);
        setSelectedTemplateId(res[0].id);
      }
    }).catch(() => {});
  }, [user?.token]);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      setChecklist([...checklist, newItemText.trim()]);
      setNewItemText('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (title.trim().length < 5) {
        Alert.alert('Required', 'Please enter a task title (min 5 characters).');
        return;
      }
      if (description.trim().length < 8) {
        Alert.alert('Required', 'Please describe the field objective.');
        return;
      }
    }
    if (step === 2) {
      if (!address.trim()) {
        Alert.alert('Required', 'Please specify the exact site address.');
        return;
      }
    }
    if (step === 4) {
      if (checklist.length === 0) {
        Alert.alert('Required', 'Please add at least one checklist item.');
        return;
      }
    }
    setStep((prev) => (prev < 5 ? ((prev + 1) as any) : 5));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const task = await mobileApi.createTask(
        {
          title,
          description,
          category,
          priority,
          customerId: user?.id || '',
          areaKey: area,
          address,
          dueAt: new Date(Date.now() + 48 * 3600000).toISOString(),
          rewardInr: Number(rewardInr) || 450,
          checklistTemplateId: selectedTemplateId,
          locationLat: 16.2418,
          locationLng: 80.6448,
          checklistItems: checklist,
        },
        user?.token
      );

      setCreatedTask(task);
      onTaskCreated(task);
    } catch {
      Alert.alert('Error', 'Failed to publish task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={createdTask ? 'Task Published!' : `Create Task (${step}/5)`}
        subtitle={createdTask ? 'Live on Field Operations Network' : 'Configurable Blueprint Task Orchestration'}
      />

      {/* Step Indicators */}
      {!createdTask && (
        <View style={styles.stepTrack}>
          {['1. Details', '2. Site', '3. Reward', '4. Checklist', '5. Review'].map((s, idx) => (
            <View
              key={idx}
              style={[
                styles.stepTab,
                step === idx + 1 && styles.stepTabActive,
                step > idx + 1 && styles.stepTabDone,
              ]}
            >
              <Text
                style={[
                  styles.stepTabText,
                  step === idx + 1 && styles.stepTabTextActive,
                  step > idx + 1 && styles.stepTabTextDone,
                ]}
              >
                {s}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {createdTask ? (
          /* Confirmation Success Screen */
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <Text style={{ fontSize: 36 }}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Task Created Successfully</Text>
            <Text style={styles.successSub}>
              Assigned Server Reference: <Text style={styles.refHighlight}>{createdTask.id}</Text>
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryRow}>📋 Title: {createdTask.title}</Text>
              <Text style={styles.summaryRow}>📍 Site: {createdTask.location.address}</Text>
              <Text style={styles.summaryRow}>💰 Bounty: ₹{createdTask.rewardInr}</Text>
              <Text style={styles.summaryRow}>🛡️ Status: OPEN (Broadcasted to nearby workers)</Text>
            </View>

            <TouchableOpacity style={styles.finishBtn} onPress={onBack}>
              <Text style={styles.finishBtnText}>Done / Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 5 Steps */
          <View style={styles.stepCard}>
            {step === 1 && (
              <View>
                <Text style={styles.stepTitle}>Step 1: Task Identity & Scope</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Task Name / Operation Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Apex Storefront Compliance & Lighting Audit"
                    placeholderTextColor={colors.textLightMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chipRow}>
                    {(['Shelf audit', 'Site survey', 'Signage check', 'Equipment inspection'] as TaskCategory[]).map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.chip, category === c && styles.chipActive]}
                        onPress={() => setCategory(c)}
                      >
                        <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Priority Level</Text>
                  <View style={styles.chipRow}>
                    {(['normal', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.chip, priority === p && styles.chipActive]}
                        onPress={() => setPriority(p)}
                      >
                        <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Objective Description *</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    placeholder="Detail the mandatory field activities to be conducted."
                    placeholderTextColor={colors.textLightMuted}
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.stepTitle}>Step 2: Location & Geofence</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cluster / Operating District</Text>
                  <TextInput
                    style={styles.input}
                    value={area}
                    onChangeText={setArea}
                    placeholderTextColor={colors.textLightMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Exact Site Street Address *</Text>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="e.g. Pillar 24, Bypass Junction"
                    placeholderTextColor={colors.textLightMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Allowed Geo-Fence Radius (Meters)</Text>
                  <TextInput
                    style={styles.input}
                    value={radiusMeters}
                    onChangeText={setRadiusMeters}
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor={colors.textLightMuted}
                  />
                  <Text style={styles.helperText}>Field workers must be within ±{radiusMeters}m to submit photo evidence.</Text>
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={styles.stepTitle}>Step 3: Worker Bounty & Reward</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Task Completion Reward (₹ INR) *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: 20, fontWeight: '700', color: colors.success }]}
                    value={rewardInr}
                    onChangeText={setRewardInr}
                    keyboardType="number-pad"
                    placeholder="450"
                    placeholderTextColor={colors.textLightMuted}
                  />
                  <Text style={styles.helperText}>
                    Credited into the verified worker's wallet upon Operations Manager review pass.
                  </Text>
                </View>

                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    🛡️ Blueprint Protection: Reward validation is executed server-side to prevent untrusted client tampering.
                  </Text>
                </View>
              </View>
            )}

            {step === 4 && (
              <View>
                <Text style={styles.stepTitle}>Step 4: Checklist & Evidence Rules</Text>
                <Text style={styles.stepSub}>Field workers must check all items before submission.</Text>

                {checklist.map((item, idx) => (
                  <View key={idx} style={styles.checklistItemRow}>
                    <Text style={styles.checkNumber}>{idx + 1}.</Text>
                    <Text style={styles.checkText}>{item}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(idx)}>
                      <Text style={styles.deleteCheckText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addCheckRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newItemText}
                    onChangeText={setNewItemText}
                    placeholder="Add mandatory checklist step..."
                    placeholderTextColor={colors.textLightMuted}
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 5 && (
              <View>
                <Text style={styles.stepTitle}>Step 5: Review & Publish</Text>
                <Text style={styles.stepSub}>Verify parameters before broadcasting to the field network.</Text>

                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>{title}</Text>
                  <Text style={styles.reviewSub}>{category} • {priority.toUpperCase()} PRIORITY</Text>

                  <Text style={styles.reviewRow}>📍 Location: {address}, {area}</Text>
                  <Text style={styles.reviewRow}>🎯 Radius: ±{radiusMeters}m Geofence</Text>
                  <Text style={styles.reviewRow}>💰 Bounty: ₹{rewardInr}</Text>
                  <Text style={styles.reviewRow}>📋 Checklist: {checklist.length} verified steps</Text>
                </View>
              </View>
            )}

            {/* Step Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.backStepBtn} onPress={handleBack}>
                <Text style={styles.backStepText}>{step === 1 ? 'Cancel' : '← Back'}</Text>
              </TouchableOpacity>

              {step < 5 ? (
                <TouchableOpacity style={styles.nextStepBtn} onPress={handleNext}>
                  <Text style={styles.nextStepText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit} disabled={loading}>
                  <Text style={styles.publishText}>{loading ? 'Publishing...' : 'Confirm & Publish Task ✓'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  stepTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  stepTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  stepTabActive: {
    borderBottomColor: colors.blueAccent,
  },
  stepTabDone: {
    borderBottomColor: colors.success,
  },
  stepTabText: {
    color: colors.textLightMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  stepTabTextActive: {
    color: colors.blueAccent,
    fontWeight: '700',
  },
  stepTabTextDone: {
    color: colors.success,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge * 2,
  },
  stepCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
  },
  stepTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepSub: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    color: colors.textLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  helperText: {
    color: colors.textLightMuted,
    fontSize: 10,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  chipActive: {
    backgroundColor: colors.bluePrimary,
    borderColor: colors.blueAccent,
  },
  chipText: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  infoBannerText: {
    color: colors.blueAccent,
    fontSize: 11,
    lineHeight: 16,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  checkNumber: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 11,
  },
  deleteCheckText: {
    color: '#F87171',
    paddingHorizontal: 6,
    fontSize: 14,
  },
  addCheckRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.bluePrimary,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  reviewCard: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reviewTitle: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  reviewSub: {
    color: colors.blueAccent,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  reviewRow: {
    color: colors.textLightMuted,
    fontSize: 11,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  backStepBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backStepText: {
    color: colors.textLightMuted,
    fontSize: 13,
  },
  nextStepBtn: {
    backgroundColor: colors.bluePrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  nextStepText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  publishBtn: {
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '700',
  },
  successSub: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
  },
  refHighlight: {
    color: colors.blueAccent,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    marginVertical: spacing.lg,
  },
  summaryRow: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 20,
  },
  finishBtn: {
    backgroundColor: colors.bluePrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
