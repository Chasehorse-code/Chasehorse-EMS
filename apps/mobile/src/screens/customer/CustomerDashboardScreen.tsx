import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { mobileApi } from '../../api/restApi';
import type { Task } from '../../types';

interface CustomerDashboardScreenProps {
  onNavigateToCreateTask: () => void;
  onNavigateToTracking: () => void;
  onNavigateToTransport: () => void;
  onSelectTask: (task: Task) => void;
}

export const CustomerDashboardScreen: React.FC<CustomerDashboardScreenProps> = ({
  onNavigateToCreateTask,
  onNavigateToTracking,
  onNavigateToTransport,
  onSelectTask,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const list = await mobileApi.listTasks({ customerId: 'cust-apex' });
    setTasks(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalTasks = tasks.length || 24;
  const openTasks = tasks.filter((t) => t.status === 'open').length || 8;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'assigned').length || 5;
  const awaitingReviewTasks = tasks.filter((t) => t.status === 'submitted' || t.status === 'in_review').length || 6;
  const completedTasks = tasks.filter((t) => t.status === 'approved').length || 5;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blueAccent} />}
      >
        {/* Welcome Back Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroPre}>WELCOME BACK</Text>
            <Text style={styles.heroTitle}>Hello, Rahul Kumar!</Text>
            <Text style={styles.heroSub}>
              Apex Retail Brands • Pan-India Field Operations
            </Text>
          </View>
          <TouchableOpacity style={styles.createTaskHeroBtn} onPress={onNavigateToCreateTask}>
            <Text style={styles.createTaskHeroBtnText}>+ Create Task</Text>
          </TouchableOpacity>
        </View>

        {/* 5 KPI Metric Cards Horizontal Scroll */}
        <Text style={styles.sectionHeading}>OPERATIONS SUMMARY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderColor: '#38BDF8' }]}>
            <Text style={styles.kpiLabel}>Total Tasks</Text>
            <Text style={styles.kpiVal}>{totalTasks}</Text>
            <Text style={styles.kpiTrend}>↑ 12% vs last month</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#60A5FA' }]}>
            <Text style={styles.kpiLabel}>Open Tasks</Text>
            <Text style={[styles.kpiVal, { color: '#60A5FA' }]}>{openTasks}</Text>
            <Text style={styles.kpiTrend}>↑ 8% active</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
            <Text style={styles.kpiLabel}>In Progress</Text>
            <Text style={[styles.kpiVal, { color: '#93C5FD' }]}>{inProgressTasks}</Text>
            <Text style={styles.kpiTrend}>Allocated in field</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#F59E0B' }]}>
            <Text style={styles.kpiLabel}>Awaiting Review</Text>
            <Text style={[styles.kpiVal, { color: '#FBBF24' }]}>{awaitingReviewTasks}</Text>
            <Text style={styles.kpiTrend}>AI checks staged</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
            <Text style={styles.kpiLabel}>Completed</Text>
            <Text style={[styles.kpiVal, { color: '#34D399' }]}>{completedTasks}</Text>
            <Text style={styles.kpiTrend}>↑ 40% verified</Text>
          </View>
        </ScrollView>

        {/* Quick Actions Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity style={styles.shortcutBtn} onPress={onNavigateToTracking}>
            <Text style={styles.shortcutIcon}>📍</Text>
            <View>
              <Text style={styles.shortcutTitle}>Track Shipment</Text>
              <Text style={styles.shortcutSub}>Consignment telemetry</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shortcutBtn} onPress={onNavigateToTransport}>
            <Text style={styles.shortcutIcon}>🚚</Text>
            <View>
              <Text style={styles.shortcutTitle}>Book Transport</Text>
              <Text style={styles.shortcutSub}>Fleet plans & rates</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Tasks List */}
        <View style={styles.tasksHeaderRow}>
          <Text style={styles.sectionHeading}>RECENT FIELD TASKS</Text>
          <TouchableOpacity onPress={onNavigateToCreateTask}>
            <Text style={styles.viewAllText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => onSelectTask(task)}
            activeOpacity={0.8}
          >
            <View style={styles.taskTopRow}>
              <Text style={styles.taskIdText}>{task.id}</Text>
              <Badge status={task.status} label={task.status.replace('_', ' ')} />
            </View>

            <Text style={styles.taskTitleText}>{task.title}</Text>
            <Text style={styles.taskDescText} numberOfLines={2}>
              {task.description}
            </Text>

            <View style={styles.taskMetaRow}>
              <Text style={styles.taskLocationText}>📍 {task.location.area || task.location.address}</Text>
              <Text style={styles.taskRewardText}>₹{task.rewardInr}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  heroBanner: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextGroup: {
    flex: 1,
  },
  heroPre: {
    color: colors.blueAccent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  heroSub: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  createTaskHeroBtn: {
    backgroundColor: colors.bluePrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  createTaskHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  kpiRow: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  kpiCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    width: 130,
  },
  kpiLabel: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  kpiVal: {
    color: colors.textLight,
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiTrend: {
    color: colors.blueAccent,
    fontSize: 10,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: colors.navyDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shortcutIcon: {
    fontSize: 24,
  },
  shortcutTitle: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutSub: {
    color: colors.textLightMuted,
    fontSize: 10,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  viewAllText: {
    color: colors.blueAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  taskIdText: {
    color: colors.blueAccent,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  taskTitleText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  taskDescText: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  taskLocationText: {
    color: colors.textLightMuted,
    fontSize: 11,
  },
  taskRewardText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
});
