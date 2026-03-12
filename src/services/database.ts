import { supabase } from '../lib/supabase';
import { Transaction, Subscription, Investment, Budget, CreditCard } from '../types';

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
  }));
}

export async function insertTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ user_id: user!.id, date: t.date, description: t.description, amount: t.amount, type: t.type, category: t.category })
    .select()
    .single();
  if (error) throw error;
  return { ...t, id: data.id };
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    billingCycle: row.billing_cycle,
    nextBillingDate: row.next_billing_date,
    category: row.category,
  }));
}

export async function insertSubscription(s: Omit<Subscription, 'id'>): Promise<Subscription> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ user_id: user!.id, name: s.name, amount: s.amount, billing_cycle: s.billingCycle, next_billing_date: s.nextBillingDate, category: s.category })
    .select()
    .single();
  if (error) throw error;
  return { ...s, id: data.id };
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw error;
}

// ─── INVESTMENTS ─────────────────────────────────────────────────────────────

export async function fetchInvestments(): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    investedAmount: Number(row.invested_amount),
    type: row.type,
    date: row.date,
  }));
}

export async function insertInvestment(inv: Omit<Investment, 'id'>): Promise<Investment> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('investments')
    .insert({ user_id: user!.id, name: inv.name, amount: inv.amount, invested_amount: inv.investedAmount, type: inv.type, date: inv.date })
    .select()
    .single();
  if (error) throw error;
  return { ...inv, id: data.id };
}

export async function deleteInvestment(id: string): Promise<void> {
  const { error } = await supabase.from('investments').delete().eq('id', id);
  if (error) throw error;
}

// ─── BUDGETS ─────────────────────────────────────────────────────────────────

export async function fetchBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
  }));
}

export async function insertBudget(b: Omit<Budget, 'id'>): Promise<Budget> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('budgets')
    .insert({ user_id: user!.id, category: b.category, amount: b.amount })
    .select()
    .single();
  if (error) throw error;
  return { ...b, id: data.id };
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

// ─── CREDIT CARDS ────────────────────────────────────────────────────────────

export async function fetchCreditCards(): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    name: row.name,
    limit: Number(row.limit),
    closingDate: row.closing_date,
    dueDate: row.due_date,
  }));
}

export async function insertCreditCard(c: Omit<CreditCard, 'id'>): Promise<CreditCard> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({ user_id: user!.id, name: c.name, limit: c.limit, closing_date: c.closingDate, due_date: c.dueDate })
    .select()
    .single();
  if (error) throw error;
  return { ...c, id: data.id };
}

export async function deleteCreditCard(id: string): Promise<void> {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id);
  if (error) throw error;
}
