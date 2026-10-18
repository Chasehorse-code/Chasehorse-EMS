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
  TmsVehicle,
  TmsTransportPlan,
  TmsShipment,
  CreateShipmentInput,
  TmsTrackingDetails,
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

  // TMS & Transport
  listVehicles(): Promise<TmsVehicle[]>;
  listShipments(): Promise<TmsShipment[]>;
  createShipment(input: CreateShipmentInput): Promise<TmsShipment>;
  getTracking(bookingRef: string): Promise<TmsTrackingDetails>;
  listTransportPlans(): Promise<TmsTransportPlan[]>;
}

