import type {
  ApprovalRequest,
  ApprovalStage,
  ChecklistTemplate,
  Customer,
  DashboardStats,
  Employee,
  EmployeeApprovalStatus,
  Evidence,
  ManagerDecisionStatus,
  NewTaskInput,
  Task,
  WalletAccount,
  WalletTransaction,
} from '@/types';

/**
 * The single seam between the UI and "the backend".
 *
 * Today `mockApi` implements this against in-memory demo data. Later, a
 * `restApi` implementation can call the Java Spring Boot service (which in
 * turn talks to Supabase PostgreSQL) without any page component changing.
 *
 * Suggested REST mapping (see docs/API_CONTRACT.md):
 *   getDashboardStats   GET   /dashboard/stats?customerId=
 *   listTasks           GET   /tasks
 *   createTask          POST  /tasks
 *   assignTask          POST  /tasks/{id}/assignment
 *   listEmployees       GET   /employees
 *   setEmployeeApproval PATCH /employees/{id}/approval
 *   listChecklists      GET   /checklist-templates
 *   saveChecklist       PUT   /checklist-templates/{id}
 *   listEvidence        GET   /evidence
 *   decideEvidence      POST  /evidence/{id}/manager-decision
 *   listApprovals       GET   /approvals
 *   decideApproval      POST  /approvals/{id}/decision
 *   listWalletAccounts  GET   /wallets
 *   listTransactions    GET   /wallets/{employeeId}/transactions
 */
export interface Actor {
  name: string;
}

export interface ChaseHorseApi {
  getDashboardStats(scope?: { customerId?: string }): Promise<DashboardStats>;

  listCustomers(): Promise<Customer[]>;

  listTasks(scope?: { customerId?: string }): Promise<Task[]>;
  createTask(input: NewTaskInput): Promise<Task>;
  assignTask(taskId: string, employeeId: string): Promise<Task>;

  listEmployees(): Promise<Employee[]>;
  setEmployeeApproval(employeeId: string, status: EmployeeApprovalStatus): Promise<Employee>;

  listChecklists(): Promise<ChecklistTemplate[]>;
  saveChecklist(template: ChecklistTemplate): Promise<ChecklistTemplate>;

  listEvidence(scope?: { customerId?: string }): Promise<Evidence[]>;
  decideEvidence(
    evidenceId: string,
    status: Exclude<ManagerDecisionStatus, 'pending'>,
    note: string,
    actor: Actor,
  ): Promise<Evidence>;

  listApprovals(): Promise<ApprovalRequest[]>;
  decideApproval(
    approvalId: string,
    stage: Exclude<ApprovalStage, 'awaiting_ops'>,
    note: string,
    actor: Actor,
  ): Promise<ApprovalRequest>;

  listWalletAccounts(): Promise<WalletAccount[]>;
  listTransactions(employeeId: string): Promise<WalletTransaction[]>;
}
