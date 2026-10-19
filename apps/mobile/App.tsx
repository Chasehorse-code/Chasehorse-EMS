import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, spacing, radius } from './src/theme';
import type { Task } from './src/types';

// Auth Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterEmployeeScreen } from './src/screens/auth/RegisterEmployeeScreen';
import { RegisterCustomerScreen } from './src/screens/auth/RegisterCustomerScreen';
import { PendingApprovalScreen } from './src/screens/auth/PendingApprovalScreen';

// Customer Screens
import { CustomerDashboardScreen } from './src/screens/customer/CustomerDashboardScreen';
import { CreateTaskScreen } from './src/screens/customer/CreateTaskScreen';
import { CustomerTrackingScreen } from './src/screens/customer/CustomerTrackingScreen';
import { CustomerTransportScreen } from './src/screens/customer/CustomerTransportScreen';
import { CustomerProfileScreen } from './src/screens/customer/CustomerProfileScreen';

// Employee Screens
import { NearbyTasksScreen } from './src/screens/employee/NearbyTasksScreen';
import { ActiveTaskScreen } from './src/screens/employee/ActiveTaskScreen';
import { WalletScreen } from './src/screens/employee/WalletScreen';
import { EmployeeProfileScreen } from './src/screens/employee/EmployeeProfileScreen';

// Manager Screens
import { ManagerReviewScreen } from './src/screens/manager/ManagerReviewScreen';
import { EmployeeApprovalsScreen } from './src/screens/manager/EmployeeApprovalsScreen';

// Admin Screens
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { EmployeeDirectoryScreen } from './src/screens/admin/EmployeeDirectoryScreen';

// Shared Components
import { TaskDetailsModal } from './src/components/TaskDetailsModal';

function MainAppNavigator() {
  const { isAuthenticated, isPendingApproval, role, signOut } = useAuth();

  // Auth navigation state
  const [authScreen, setAuthScreen] = useState<'login' | 'register_employee' | 'register_customer'>('login');

  // Customer tab state
  const [customerTab, setCustomerTab] = useState<'dashboard' | 'create_task' | 'tracking' | 'transport' | 'profile'>('dashboard');

  // Employee tab state
  const [employeeTab, setEmployeeTab] = useState<'nearby' | 'active' | 'wallet' | 'profile'>('nearby');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Manager tab state
  const [managerTab, setManagerTab] = useState<'review' | 'approvals' | 'profile'>('review');

  // Admin tab state
  const [adminTab, setAdminTab] = useState<'dashboard' | 'review' | 'approvals' | 'directory' | 'profile'>('dashboard');

  // Modal inspection state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // 1. Unauthenticated State
  if (!isAuthenticated) {
    if (authScreen === 'register_employee') {
      return (
        <SafeAreaView style={styles.safe}>
          <RegisterEmployeeScreen onBackToLogin={() => setAuthScreen('login')} />
        </SafeAreaView>
      );
    }
    if (authScreen === 'register_customer') {
      return (
        <SafeAreaView style={styles.safe}>
          <RegisterCustomerScreen onBackToLogin={() => setAuthScreen('login')} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.safe}>
        <LoginScreen
          onNavigateToRegisterEmployee={() => setAuthScreen('register_employee')}
          onNavigateToRegisterCustomer={() => setAuthScreen('register_customer')}
        />
      </SafeAreaView>
    );
  }

  // 2. Pending Approval Quarantine
  if (isPendingApproval) {
    return (
      <SafeAreaView style={styles.safe}>
        <PendingApprovalScreen />
      </SafeAreaView>
    );
  }

  // 3. Customer Portal Flow
  if (role === 'customer') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.contentArea}>
          {customerTab === 'dashboard' && (
            <CustomerDashboardScreen
              onNavigateToCreateTask={() => setCustomerTab('create_task')}
              onNavigateToTracking={() => setCustomerTab('tracking')}
              onNavigateToTransport={() => setCustomerTab('transport')}
              onSelectTask={(task) => setSelectedTask(task)}
            />
          )}
          {customerTab === 'create_task' && (
            <CreateTaskScreen
              onBack={() => setCustomerTab('dashboard')}
              onTaskCreated={() => setCustomerTab('dashboard')}
            />
          )}
          {customerTab === 'tracking' && <CustomerTrackingScreen />}
          {customerTab === 'transport' && <CustomerTransportScreen />}
          {customerTab === 'profile' && <CustomerProfileScreen />}
        </View>

        {/* Customer Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, customerTab === 'dashboard' && styles.navItemActive]}
            onPress={() => setCustomerTab('dashboard')}
          >
            <Text style={styles.navIcon}>📊</Text>
            <Text style={[styles.navLabel, customerTab === 'dashboard' && styles.navLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, customerTab === 'create_task' && styles.navItemActive]}
            onPress={() => setCustomerTab('create_task')}
          >
            <Text style={styles.navIcon}>➕</Text>
            <Text style={[styles.navLabel, customerTab === 'create_task' && styles.navLabelActive]}>
              Create Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, customerTab === 'tracking' && styles.navItemActive]}
            onPress={() => setCustomerTab('tracking')}
          >
            <Text style={styles.navIcon}>📍</Text>
            <Text style={[styles.navLabel, customerTab === 'tracking' && styles.navLabelActive]}>
              Tracking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, customerTab === 'transport' && styles.navItemActive]}
            onPress={() => setCustomerTab('transport')}
          >
            <Text style={styles.navIcon}>🚚</Text>
            <Text style={[styles.navLabel, customerTab === 'transport' && styles.navLabelActive]}>
              Transport
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, customerTab === 'profile' && styles.navItemActive]}
            onPress={() => setCustomerTab('profile')}
          >
            <Text style={styles.navIcon}>🏢</Text>
            <Text style={[styles.navLabel, customerTab === 'profile' && styles.navLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      </SafeAreaView>
    );
  }

  // 4. Field Employee Portal Flow
  if (role === 'employee') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.contentArea}>
          {employeeTab === 'nearby' && (
            <NearbyTasksScreen
              onAcceptTask={(task) => {
                setActiveTask(task);
                setEmployeeTab('active');
              }}
              onSelectTask={(task) => setSelectedTask(task)}
            />
          )}
          {employeeTab === 'active' && (
            <ActiveTaskScreen
              task={activeTask}
              onTaskCompleted={() => {
                setActiveTask(null);
                setEmployeeTab('wallet');
              }}
              onNavigateToNearby={() => setEmployeeTab('nearby')}
            />
          )}
          {employeeTab === 'wallet' && <WalletScreen />}
          {employeeTab === 'profile' && <EmployeeProfileScreen />}
        </View>

        {/* Employee Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, employeeTab === 'nearby' && styles.navItemActive]}
            onPress={() => setEmployeeTab('nearby')}
          >
            <Text style={styles.navIcon}>🧭</Text>
            <Text style={[styles.navLabel, employeeTab === 'nearby' && styles.navLabelActive]}>
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, employeeTab === 'active' && styles.navItemActive]}
            onPress={() => setEmployeeTab('active')}
          >
            <Text style={styles.navIcon}>⚡</Text>
            <Text style={[styles.navLabel, employeeTab === 'active' && styles.navLabelActive]}>
              Active Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, employeeTab === 'wallet' && styles.navItemActive]}
            onPress={() => setEmployeeTab('wallet')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={[styles.navLabel, employeeTab === 'wallet' && styles.navLabelActive]}>
              Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, employeeTab === 'profile' && styles.navItemActive]}
            onPress={() => setEmployeeTab('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={[styles.navLabel, employeeTab === 'profile' && styles.navLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAccept={(task) => {
            setActiveTask(task);
            setEmployeeTab('active');
          }}
        />
      </SafeAreaView>
    );
  }

  // 5. Operations Manager Portal Flow
  if (role === 'manager') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.contentArea}>
          {managerTab === 'review' && <ManagerReviewScreen />}
          {managerTab === 'approvals' && <EmployeeApprovalsScreen />}
          {managerTab === 'profile' && <EmployeeProfileScreen />}
        </View>

        {/* Manager Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, managerTab === 'review' && styles.navItemActive]}
            onPress={() => setManagerTab('review')}
          >
            <Text style={styles.navIcon}>📋</Text>
            <Text style={[styles.navLabel, managerTab === 'review' && styles.navLabelActive]}>
              Review Queue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, managerTab === 'approvals' && styles.navItemActive]}
            onPress={() => setManagerTab('approvals')}
          >
            <Text style={styles.navIcon}>🛡️</Text>
            <Text style={[styles.navLabel, managerTab === 'approvals' && styles.navLabelActive]}>
              Approvals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, managerTab === 'profile' && styles.navItemActive]}
            onPress={() => setManagerTab('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={[styles.navLabel, managerTab === 'profile' && styles.navLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 6. Admin Enterprise Portal Flow
  if (role === 'admin') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.contentArea}>
          {adminTab === 'dashboard' && (
            <AdminDashboardScreen
              onNavigateToReview={() => setAdminTab('review')}
              onNavigateToApprovals={() => setAdminTab('approvals')}
              onNavigateToDirectory={() => setAdminTab('directory')}
            />
          )}
          {adminTab === 'review' && <ManagerReviewScreen />}
          {adminTab === 'approvals' && <EmployeeApprovalsScreen />}
          {adminTab === 'directory' && <EmployeeDirectoryScreen />}
          {adminTab === 'profile' && <EmployeeProfileScreen />}
        </View>

        {/* Admin Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, adminTab === 'dashboard' && styles.navItemActive]}
            onPress={() => setAdminTab('dashboard')}
          >
            <Text style={styles.navIcon}>📊</Text>
            <Text style={[styles.navLabel, adminTab === 'dashboard' && styles.navLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, adminTab === 'review' && styles.navItemActive]}
            onPress={() => setAdminTab('review')}
          >
            <Text style={styles.navIcon}>📋</Text>
            <Text style={[styles.navLabel, adminTab === 'review' && styles.navLabelActive]}>
              Review
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, adminTab === 'approvals' && styles.navItemActive]}
            onPress={() => setAdminTab('approvals')}
          >
            <Text style={styles.navIcon}>🛡️</Text>
            <Text style={[styles.navLabel, adminTab === 'approvals' && styles.navLabelActive]}>
              Approvals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, adminTab === 'directory' && styles.navItemActive]}
            onPress={() => setAdminTab('directory')}
          >
            <Text style={styles.navIcon}>👥</Text>
            <Text style={[styles.navLabel, adminTab === 'directory' && styles.navLabelActive]}>
              Directory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, adminTab === 'profile' && styles.navItemActive]}
            onPress={() => setAdminTab('profile')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={[styles.navLabel, adminTab === 'profile' && styles.navLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback for unexpected or unassigned role
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.contentArea, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Text style={{ fontSize: 40, marginBottom: spacing.md }}>🔒</Text>
        <Text style={{ color: colors.textLight, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm }}>
          Access Under Configuration
        </Text>
        <Text style={{ color: colors.textLightMuted, fontSize: 13, textAlign: 'center', marginBottom: spacing.xl }}>
          Your account role ({role || 'unassigned'}) does not have an active mobile portal layout assigned. Please contact your system administrator.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.surfaceDark, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.md }}
          onPress={signOut}
        >
          <Text style={{ color: colors.textLight, fontWeight: '700' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" />
      <ExpoStatusBar style="light" />
      <MainAppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navyDeep,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.navyDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  navItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  navLabel: {
    color: colors.textLightMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  navLabelActive: {
    color: colors.blueAccent,
    fontWeight: '700',
  },
});