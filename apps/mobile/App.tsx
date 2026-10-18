import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

interface FieldTask {
  id: string;
  title: string;
  category: string;
  location: string;
  distanceKm: number;
  rewardInr: number;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED';
  checklist: { id: string; label: string; done: boolean; requiresPhoto: boolean }[];
  photoAttached?: boolean;
}

interface WalletItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

const initialTasks: FieldTask[] = [
  {
    id: 'tsk-001',
    title: 'Supermarket Shelf Audit & Stock Verification',
    category: 'Shelf audit',
    location: 'Indiranagar 100ft Road, Bangalore',
    distanceKm: 1.4,
    rewardInr: 450,
    priority: 'HIGH',
    status: 'OPEN',
    checklist: [
      { id: 'c1', label: 'Verify shelf facing and SKU count for Brand X', done: false, requiresPhoto: true },
      { id: 'c2', label: 'Inspect promotional discount signage', done: false, requiresPhoto: true },
      { id: 'c3', label: 'Record inventory expiry dates on top rack', done: false, requiresPhoto: false },
    ],
  },
  {
    id: 'tsk-002',
    title: 'Retail Store Signage Compliance Check',
    category: 'Signage check',
    location: 'Koramangala 5th Block, Bangalore',
    distanceKm: 3.2,
    rewardInr: 350,
    priority: 'NORMAL',
    status: 'OPEN',
    checklist: [
      { id: 'c4', label: 'Capture wide exterior storefront photo', done: false, requiresPhoto: true },
      { id: 'c5', label: 'Measure illumination of entrance LED board', done: false, requiresPhoto: false },
    ],
  },
  {
    id: 'tsk-003',
    title: 'Distribution Depot Equipment Tag Inspection',
    category: 'Equipment inspection',
    location: 'Whitefield Industrial Area',
    distanceKm: 8.5,
    rewardInr: 800,
    priority: 'URGENT',
    status: 'OPEN',
    checklist: [
      { id: 'c6', label: 'Scan QR tag on forklift #4', done: false, requiresPhoto: true },
      { id: 'c7', label: 'Confirm fire extinguisher pressure gauge in green', done: false, requiresPhoto: true },
    ],
  },
];

const initialWallet: WalletItem[] = [
  { id: 'w1', title: 'Task Reward: Retail Shelf Audit (Metro Mall)', amount: 450, date: 'Yesterday, 17:30', status: 'COMPLETED' },
  { id: 'w2', title: 'Task Reward: Pharmacy Billboard Survey', amount: 350, date: '16 Oct, 14:10', status: 'COMPLETED' },
  { id: 'w3', title: 'Performance Bonus: 100% SLA Week 41', amount: 500, date: '15 Oct, 09:00', status: 'COMPLETED' },
];

export default function App() {
  const [tab, setTab] = useState<'nearby' | 'active' | 'wallet'>('nearby');
  const [tasks, setTasks] = useState<FieldTask[]>(initialTasks);
  const [activeTaskId, setActiveTaskId] = useState<string | null>('tsk-001');
  const [wallet, setWallet] = useState<WalletItem[]>(initialWallet);
  const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const totalBalance = wallet.filter((w) => w.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);

  const handleAcceptTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, status: 'IN_PROGRESS' } : t)),
    );
    setActiveTaskId(id);
    setTab('active');
  };

  const handleToggleChecklist = (checkId: string) => {
    if (!activeTaskId) return;
    setTasks(
      tasks.map((t) => {
        if (t.id !== activeTaskId) return t;
        return {
          ...t,
          checklist: t.checklist.map((c) =>
            c.id === checkId ? { ...c, done: !c.done } : c,
          ),
        };
      }),
    );
  };

  const handleSubmitTask = () => {
    if (!activeTaskId) return;
    const taskReward = activeTask?.rewardInr || 450;
    setTasks(
      tasks.map((t) => (t.id === activeTaskId ? { ...t, status: 'SUBMITTED' } : t)),
    );
    setWallet([
      {
        id: `w-${Date.now()}`,
        title: `Task Reward: ${activeTask?.title.slice(0, 30)}...`,
        amount: taskReward,
        date: 'Just now (Submitted)',
        status: 'PENDING',
      },
      ...wallet,
    ]);
    alert('Task submitted with photo evidence and GPS stamp! Awaiting operations review.');
    setTab('wallet');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ExpoStatusBar style="light" />

      {/* Top Header Bar */}
      <View style={styles.topbar}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>CH</Text>
            </View>
            <View>
              <Text style={styles.appName}>ChaseHorse Field</Text>
              <Text style={styles.workerRole}>Devendra Kumar • Field Officer</Text>
            </View>
          </View>
        </View>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceVal}>₹{totalBalance}</Text>
        </View>
      </View>

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'nearby' && styles.tabBtnActive]}
          onPress={() => setTab('nearby')}
        >
          <Text style={[styles.tabBtnText, tab === 'nearby' && styles.tabBtnTextActive]}>
            Nearby Tasks ({tasks.filter((t) => t.status === 'OPEN').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabBtnText, tab === 'active' && styles.tabBtnTextActive]}>
            Active Execution
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'wallet' && styles.tabBtnActive]}
          onPress={() => setTab('wallet')}
        >
          <Text style={[styles.tabBtnText, tab === 'wallet' && styles.tabBtnTextActive]}>
            Wallet (₹{totalBalance})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'nearby' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Field Tasks in Your Area</Text>
            <Text style={styles.sectionSub}>Accept an assignment to lock your geotag and start evidence collection.</Text>

            {tasks.map((item) => (
              <View key={item.id} style={styles.taskCard}>
                <View style={styles.taskCardHeader}>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                  <Text style={styles.distanceBadge}>{item.distanceKm} km away</Text>
                </View>

                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskLocation}>📍 {item.location}</Text>

                <View style={styles.taskFooter}>
                  <View>
                    <Text style={styles.rewardLabel}>Completion Reward</Text>
                    <Text style={styles.rewardVal}>₹{item.rewardInr}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptTask(item.id)}
                  >
                    <Text style={styles.acceptBtnText}>
                      {item.status === 'IN_PROGRESS' ? 'Resume Task' : 'Accept Assignment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'active' && (
          <View style={styles.section}>
            {activeTask ? (
              <View>
                <View style={styles.activeHeaderCard}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{activeTask.status}</Text>
                  </View>
                  <Text style={styles.activeTitle}>{activeTask.title}</Text>
                  <Text style={styles.activeLocation}>📍 {activeTask.location}</Text>
                  <Text style={styles.activeReward}>Reward upon approval: ₹{activeTask.rewardInr}</Text>
                </View>

                {/* Checklist Execution */}
                <View style={styles.card}>
                  <Text style={styles.cardHeading}>Mandatory Checklist</Text>
                  {activeTask.checklist.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checkRow}
                      onPress={() => handleToggleChecklist(item.id)}
                    >
                      <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
                        {item.done && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.checkContent}>
                        <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>
                          {item.label}
                        </Text>
                        {item.requiresPhoto && (
                          <Text style={styles.photoRequiredTag}>📷 Photo proof mandatory</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Geotagged Evidence Section */}
                <View style={styles.card}>
                  <Text style={styles.cardHeading}>Field Evidence & Camera</Text>
                  <Text style={styles.cardSub}>Capture high-resolution photo with embedded tamper-proof GPS coordinates.</Text>

                  <TouchableOpacity
                    style={[styles.cameraBox, isPhotoCaptured && styles.cameraBoxSuccess]}
                    onPress={() => setIsPhotoCaptured(!isPhotoCaptured)}
                  >
                    <Text style={styles.cameraIcon}>{isPhotoCaptured ? '📸 ✅' : '📷'}</Text>
                    <Text style={styles.cameraText}>
                      {isPhotoCaptured
                        ? 'Geotagged Photo Staged: 12.9716° N, 77.5946° E\n(Tap to re-capture)'
                        : 'Tap to capture inspection photo'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (!isPhotoCaptured || !activeTask.checklist.every((c) => c.done)) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmitTask}
                  >
                    <Text style={styles.submitBtnText}>Submit Task for Operations Approval</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Active Assignment</Text>
                <Text style={styles.emptySub}>Select a task from the Nearby tab to begin work.</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'wallet' && (
          <View style={styles.section}>
            {/* Wallet Overview Card */}
            <View style={styles.walletHeroCard}>
              <Text style={styles.walletHeroLabel}>Available Withdrawable Balance</Text>
              <Text style={styles.walletHeroAmount}>₹{totalBalance}.00</Text>
              <Text style={styles.walletHeroSub}>Direct transfer to UPI / Verified Bank Account</Text>

              <TouchableOpacity style={styles.withdrawBtn} onPress={() => alert('Withdrawal request of ₹' + totalBalance + ' initiated to your registered bank account.')}>
                <Text style={styles.withdrawBtnText}>Request Instant Payout</Text>
              </TouchableOpacity>
            </View>

            {/* Ledger History */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Wallet Ledger & Activity</Text>
              {wallet.map((w) => (
                <View key={w.id} style={styles.walletRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.walletTitle}>{w.title}</Text>
                    <Text style={styles.walletDate}>{w.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.walletAmount, w.status === 'PENDING' && styles.walletAmountPending]}>
                      +{w.amount} INR
                    </Text>
                    <Text style={[styles.walletStatus, w.status === 'COMPLETED' ? styles.walletStatusSuccess : styles.walletStatusWarn]}>
                      {w.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  topbar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  appName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  workerRole: { color: '#94a3b8', fontSize: 12 },
  balanceBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' },
  balanceVal: { color: '#4ade80', fontSize: 15, fontWeight: '700' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: { backgroundColor: '#1e293b' },
  tabBtnText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tabBtnTextActive: { color: '#ffffff' },
  content: { padding: 16, gap: 16 },
  section: { gap: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  sectionSub: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  taskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  distanceBadge: { color: '#94a3b8', fontSize: 12 },
  taskTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  taskLocation: { color: '#94a3b8', fontSize: 13 },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  rewardLabel: { color: '#64748b', fontSize: 11 },
  rewardVal: { color: '#4ade80', fontSize: 18, fontWeight: '800' },
  acceptBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acceptBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  activeHeaderCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  activeTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  activeLocation: { color: '#94a3b8', fontSize: 13 },
  activeReward: { color: '#4ade80', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeading: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkmark: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  checkContent: { flex: 1, gap: 3 },
  checkLabel: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  checkLabelDone: { textDecorationLine: 'line-through', color: '#64748b' },
  photoRequiredTag: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  cameraBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  cameraBoxSuccess: { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' },
  cameraIcon: { fontSize: 32 },
  cameraText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  submitBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  emptyState: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  walletHeroCard: {
    backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  walletHeroLabel: { color: '#93c5fd', fontSize: 13, fontWeight: '600' },
  walletHeroAmount: { color: '#ffffff', fontSize: 36, fontWeight: '900' },
  walletHeroSub: { color: '#cbd5e1', fontSize: 12 },
  withdrawBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  withdrawBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  walletTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  walletDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
  walletAmount: { color: '#4ade80', fontSize: 15, fontWeight: '700' },
  walletAmountPending: { color: '#facc15' },
  walletStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  walletStatusSuccess: { color: '#22c55e' },
  walletStatusWarn: { color: '#eab308' },
});