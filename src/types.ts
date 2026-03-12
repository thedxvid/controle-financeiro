export type TransactionType = 'income' | 'expense' | 'investment';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface Category {
  name: string;
  type: TransactionType;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDate: number; // day of month
  dueDate: number; // day of month
}

export interface Investment {
  id: string;
  name: string;
  amount: number;
  investedAmount: number;
  type: string;
  date: string;
}
