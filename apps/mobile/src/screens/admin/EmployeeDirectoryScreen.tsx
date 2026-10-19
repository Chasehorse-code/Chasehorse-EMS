import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { mobileApi } from '../../api/restApi';
import { useAuth } from '../../context/AuthContext';
import type { EmployeeDirectoryItem } from '../../types';

export const EmployeeDirectoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      const list = await mobileApi.listEmployees(user?.token);
      setEmployees(list);
    } catch (err) {
      console.warn('[EmployeeDirectory] Failed to load employees:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  const handleToggleStatus = (emp: EmployeeDirectoryItem) => {
    const isCurrentlyActive = emp.accountStatus?.toLowerCase() === 'active';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
    const primaryRole = emp.roles?.[0] || 'EMPLOYEE';

    Alert.alert(
      `${isCurrentlyActive ? 'Suspend' : 'Activate'} Employee?`,
      `Are you sure you want to change ${emp.displayName}'s status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(emp.id);
            try {
              await mobileApi.setEmployeeApproval(emp.id, newStatus, primaryRole, user?.token);
              Alert.alert('Status Updated', `Employee ${emp.displayName} is now ${newStatus}.`);
              await loadEmployees();
            } catch (err: any) {
              Alert.alert('Update Failed', err?.message || 'Server rejected status change.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      emp.displayName?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.region?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      emp.accountStatus?.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Employee Directory"
        subtitle="Workforce Management & Role Governance"
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or region..."
          placeholderTextColor={colors.textLightMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.blueAccent} />
          <Text style={styles.loadingText}>Loading employee directory...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.blueAccent}
            />
          }
        >
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              Showing {filteredEmployees.length} of {employees.length} Staff Members
            </Text>
          </View>

          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching employees</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search criteria or filter options.
              </Text>
            </View>
          ) : (
            filteredEmployees.map((emp) => {
              const isActing = actionLoading === emp.id;
              const isActive = emp.accountStatus?.toLowerCase() === 'active';

              return (
                <View key={emp.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(emp.displayName || 'EM').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.empName}>{emp.displayName || 'Field Worker'}</Text>
                      <Text style={styles.empEmail}>{emp.email}</Text>
                    </View>
                    <Badge
                      tone={
                        emp.accountStatus?.toLowerCase() === 'active'
                          ? 'success'
                          : emp.accountStatus?.toLowerCase() === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                      label={(emp.accountStatus || 'ACTIVE').toUpperCase()}
                    />
                  </View>

                  <View style={styles.detailsBox}>
                    <Text style={styles.detailItem}>
                      📍 Cluster: {emp.region || 'Standard Operations'}
                    </Text>
                    <Text style={styles.detailItem}>
                      📱 Mobile: {emp.phone || 'Not Registered'}
                    </Text>
                    <Text style={styles.detailItem}>
                      🛡️ Roles: {(emp.roles && emp.roles.length > 0 ? emp.roles : ['EMPLOYEE']).join(', ')}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    {isActing ? (
                      <ActivityIndicator size="small" color={colors.blueAccent} />
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.statusToggleBtn,
                          isActive ? styles.suspendBtn : styles.activateBtn,
                        ]}
                        onPress={() => handleToggleStatus(emp)}
                      >
                        <Text
                          style={[
                            styles.statusToggleText,
                            isActive ? styles.suspendText : styles.activateText,
                          ]}
                        >
                          {isActive ? 'Suspend Access ✕' : 'Activate Access ✓'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.navyDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textLight,
    fontSize: 13,
  },
  filterScroll: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceDark,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: colors.blueAccent,
  },
  filterText: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.blueAccent,
  },
  centerContainer: {
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
    marginBottom: spacing.md,
  },
  summaryText: {
    color: colors.textLightMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bluePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  empName: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  empEmail: {
    color: colors.textLightMuted,
    fontSize: 11,
    marginTop: 1,
  },
  detailsBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: 4,
  },
  detailItem: {
    color: colors.textLight,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  cardActions: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    alignItems: 'flex-end',
  },
  statusToggleBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  suspendBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  activateBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suspendText: {
    color: '#F87171',
  },
  activateText: {
    color: colors.success,
  },
});
