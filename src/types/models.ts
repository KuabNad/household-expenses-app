import type { Timestamp } from 'firebase/firestore';

export type Currency = 'EUR' | 'USD' | 'GBP' | 'PLN' | 'CAD' | 'AUD';
export type RecurrenceFrequency = 'monthly' | 'yearly';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  householdId: string | null;
  createdAt: Timestamp | null;
}

export interface HouseholdMember {
  email: string;
  displayName: string;
  joinedAt: Timestamp | null;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: Record<string, HouseholdMember>;
  memberIds: string[];
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface Expense {
  id: string;
  householdId: string;
  amount: number;
  currency: Currency;
  date: string;
  categoryId: string;
  description: string;
  paidByUserId: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  isProjected?: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Category {
  id: string;
  householdId: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface ExpenseInput {
  amount: number;
  currency: Currency;
  date: string;
  categoryId: string;
  description: string;
  paidByUserId: string;
  paymentMethod?: string;
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
}

export interface MonthlyIncome {
  id: string;
  householdId: string;
  userId: string;
  month: string;
  amount: number;
  currency: Currency;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
