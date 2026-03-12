import { Budget, Transaction } from '../types';
import { Trash2, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  budgets: Budget[];
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function BudgetsView({ budgets, transactions, onDelete }: Props) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const expensesThisMonth = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Metas de Gastos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((budget) => {
          const spent = expensesThisMonth
            .filter(t => t.category === budget.category)
            .reduce((acc, t) => acc + t.amount, 0);
          
          const percentage = Math.min((spent / budget.amount) * 100, 100);
          const isOverBudget = spent > budget.amount;

          return (
            <div key={budget.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative group">
              <button 
                onClick={() => onDelete(budget.id)}
                className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Excluir Meta"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{budget.category}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.amount)} / mês
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className={isOverBudget ? "text-red-600 dark:text-red-500" : "text-zinc-600 dark:text-zinc-400"}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)} gasto
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isOverBudget ? "bg-red-500" : percentage > 80 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {isOverBudget && (
                  <p className="text-xs text-red-600 dark:text-red-500 font-medium mt-2">
                    Você ultrapassou sua meta em {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent - budget.amount)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
            <Target size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nenhuma meta definida</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Adicione metas de gastos para controlar seu orçamento mensal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
