import { Category, Transaction, Subscription, Investment, Budget, CreditCard } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { name: 'Salário', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Rendimentos', type: 'income' },
  { name: 'Alimentação', type: 'expense' },
  { name: 'Moradia', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Saúde', type: 'expense' },
  { name: 'Lazer', type: 'expense' },
  { name: 'Educação', type: 'expense' },
  { name: 'Assinaturas', type: 'expense' },
  { name: 'Investimento', type: 'investment' },
  { name: 'Outros', type: 'expense' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    description: 'Salário',
    amount: 5000,
    type: 'income',
    category: 'Salário',
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    description: 'Supermercado',
    amount: 350.50,
    type: 'expense',
    category: 'Alimentação',
  },
  {
    id: '3',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    description: 'CDB Banco Inter',
    amount: 500.00,
    type: 'investment',
    category: 'Investimento',
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: '1', name: 'Netflix', amount: 39.90, billingCycle: 'monthly', nextBillingDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], category: 'Assinaturas' },
  { id: '2', name: 'Spotify', amount: 21.90, billingCycle: 'monthly', nextBillingDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0], category: 'Assinaturas' },
];

export const INITIAL_INVESTMENTS: Investment[] = [
  { id: '1', name: 'CDB Banco Inter', amount: 510.50, investedAmount: 500.00, type: 'Renda Fixa', date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0] },
  { id: '2', name: 'Tesouro IPCA+', amount: 1050.00, investedAmount: 1000.00, type: 'Renda Fixa', date: new Date(Date.now() - 86400000 * 120).toISOString().split('T')[0] },
  { id: '3', name: 'FII MXRF11', amount: 480.00, investedAmount: 500.00, type: 'Fundo Imobiliário', date: new Date(Date.now() - 86400000 * 60).toISOString().split('T')[0] },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: '1', category: 'Alimentação', amount: 1000 },
  { id: '2', category: 'Lazer', amount: 300 },
];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  { id: '1', name: 'Nubank', limit: 5000, closingDate: 25, dueDate: 5 },
];
