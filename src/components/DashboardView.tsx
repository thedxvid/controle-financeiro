import { Transaction, Subscription, Investment } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, CreditCard, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

interface Props {
  transactions: Transaction[];
  subscriptions: Subscription[];
  investments: Investment[];
}

export default function DashboardView({ transactions, subscriptions, investments }: Props) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const monthlySubscriptions = subscriptions.filter(s => s.billingCycle === 'monthly').reduce((acc, s) => acc + s.amount, 0);
  const balance = totalIncome - totalExpense;

  // Prepare data for Pie Chart (Expenses by Category)
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  // Prepare data for Pie Chart (Incomes by Category)
  const incomesByCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomePieData = Object.entries(incomesByCategory).map(([name, value]) => ({ name, value }));

  // Prepare data for Bar Chart (Income vs Expense by Month)
  const monthlyDataMap = new Map<string, { name: string; Receitas: number; Despesas: number }>();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyDataMap.set(key, { name: monthName, Receitas: 0, Despesas: 0 });
  }

  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    // Only add to chart if it's within the last 6 months we initialized
    if (monthlyDataMap.has(key)) {
      const data = monthlyDataMap.get(key)!;
      if (t.type === 'income') data.Receitas += t.amount;
      if (t.type === 'expense') data.Despesas += t.amount;
    }
  });

  const barData = Array.from(monthlyDataMap.values());

  // Upcoming Reminders (Subscriptions due in the next 14 days)
  const today = new Date();
  const upcomingSubscriptions = subscriptions.filter(sub => {
    const nextDate = new Date(sub.nextBillingDate);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  }).sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <Wallet size={18} />
            <h3 className="text-sm font-medium">Saldo Atual</h3>
          </div>
          <p className={cn("text-2xl font-semibold", balance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500")}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-emerald-600 dark:text-emerald-500">
            <ArrowUpCircle size={18} />
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Receitas</h3>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-red-600 dark:text-red-500">
            <ArrowDownCircle size={18} />
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Despesas</h3>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-500">
            <TrendingUp size={18} />
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Investimentos</h3>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
          </p>
        </div>
      </div>

      {upcomingSubscriptions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-amber-700 dark:text-amber-500">
            <Bell size={20} />
            <h3 className="font-semibold">Lembretes de Vencimento (Próximos 14 dias)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSubscriptions.map(sub => {
              const nextDate = new Date(sub.nextBillingDate);
              const diffTime = nextDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              return (
                <div key={sub.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{sub.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {diffDays === 0 ? 'Vence hoje' : diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`}
                    </p>
                  </div>
                  <p className="font-semibold text-amber-700 dark:text-amber-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Evolução de Receitas e Despesas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} tick={{ fill: '#888' }} />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Despesas por Categoria</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full h-48 md:h-64 md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-600 dark:text-zinc-400">{entry.name}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
              Nenhuma despesa registrada.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Receitas por Categoria</h3>
          {incomePieData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full h-48 md:h-64 md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-2">
                {incomePieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-600 dark:text-zinc-400">{entry.name}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
              Nenhuma receita registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
