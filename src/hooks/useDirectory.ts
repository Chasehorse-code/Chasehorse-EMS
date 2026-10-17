import { useMemo } from 'react';
import { api } from '@/api';
import { useAsync } from './useAsync';
import type { Customer, Employee } from '@/types';

/** Loads employees + customers once so pages can resolve ids to names. */
export function useDirectory() {
  const state = useAsync(async () => {
    const [employees, customers] = await Promise.all([api.listEmployees(), api.listCustomers()]);
    return { employees, customers };
  }, []);

  return useMemo(() => {
    const employees: Employee[] = state.data?.employees ?? [];
    const customers: Customer[] = state.data?.customers ?? [];
    return {
      loading: state.loading && !state.data,
      employees,
      customers,
      employeeName: (id?: string) => employees.find((e) => e.id === id)?.name ?? '—',
      customerName: (id?: string) => customers.find((c) => c.id === id)?.name ?? '—',
    };
  }, [state.data, state.loading]);
}
