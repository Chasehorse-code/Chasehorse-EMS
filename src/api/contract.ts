import type {
  ApprovalRequest,
  ApprovalStage,
  ChecklistTemplate,
  Customer,
  DashboardStats,
  Employee,
  EmployeeApprovalStatus,
  EmployeeSubRole,
  Evidence,
  ManagerDecisionStatus,
  NewTaskInput,
  Task,
  WalletAccount,
  WalletTransaction,
} from '@/types';

/**
 * The single seam between the UI and the Spring Boot backend (`/api/v1/*`).
 */
export interface Actor {
  name: string;
}

export interface ChaseHorseApi {
  getDashboardStats(scope?: { customerId?: string }): Promise<DashboardStats>;

  listCustomers(): Promise<Customer[]>;

  listTasks(scope?: { customerId?: string }): Promise<Task[]>;
  listNearbyTasks(lat: number, lng: number, radiusKm?: number): Promise<Task[]>;
  createTask(input: NewTaskInput): Promise<Task>;
  assignTask(taskId: string, employeeId: string): Promise<Task>;
  acceptTask(taskId: string): Promise<Task>;
  rejectTask(taskId: string, reason?: string): Promise<Task>;

  listEmployees(): Promise<Employee[]>;
  setEmployeeApproval(
    employeeId: string,
    status: EmployeeApprovalStatus,
    subRole?: EmployeeSubRole,
  ): Promise<Employee>;

  listChecklists(): Promise<ChecklistTemplate[]>;
  saveChecklist(template: ChecklistTemplate): Promise<ChecklistTemplate>;

  listEvidence(scope?: { customerId?: string }): Promise<Evidence[]>;
  submitEvidence(
    taskId: string,
    payload: {
      photos: Array<{
        caption: string;
        url: string;
        checklistItemId?: string;
        geotag?: any;
      }>;
      checklist: Array<{ itemId: string; label: string; done: boolean }>;
      aiResult?: any;
    },
  ): Promise<Evidence>;
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
    reworkInstructions?: string,
  ): Promise<ApprovalRequest>;

  listWalletAccounts(): Promise<WalletAccount[]>;
  listTransactions(employeeId: string): Promise<WalletTransaction[]>;
}
