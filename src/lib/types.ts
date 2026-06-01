export interface Patient {
  id?: string;
  status: "admitted" | "discharged";
  name: string;
  phone: string;
  address: string;
  guardianName?: string;
  photo?: string;
  fee: number; // backward compatibility, might treat as paid or total
  totalFee?: number;
  installment1?: number;
  installment1Date?: string;
  installment2?: number;
  installment2Date?: string;
  installment3?: number;
  installment3Date?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceRecord {
  id?: string;
  type: "income" | "clinic_expense" | "market_expense";
  amount: number;
  description: string;
  createdAt: string;
}

export interface Staff {
  id?: string;
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  salary: number;
  createdAt: string;
}

export interface Volunteer {
  id?: string;
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  createdAt: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}
