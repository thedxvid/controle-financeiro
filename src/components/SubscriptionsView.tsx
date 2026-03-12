import { Subscription } from '../types';
import { CreditCard, Calendar, Trash2 } from 'lucide-react';

interface Props {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
}

export default function SubscriptionsView({ subscriptions, onDelete }: Props) {
  const totalMonthly = subscriptions
    .filter(s => s.billingCycle === 'monthly')
    .reduce((acc, s) => acc + s.amount, 0);

  const totalYearly = subscriptions
    .filter(s => s.billingCycle === 'yearly')
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Assinaturas</h2>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Custo Mensal</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthly)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Custo Anual</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalYearly)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm group relative">
            <button 
              onClick={() => onDelete(sub.id)}
              className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
              <CreditCard size={20} />
            </div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-1">{sub.name}</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount)}
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">/{sub.billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg">
              <Calendar size={14} />
              <span>Próxima cobrança: {new Date(sub.nextBillingDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
            </div>
          </div>
        ))}
        {subscriptions.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 border-dashed">
            Nenhuma assinatura registrada.
          </div>
        )}
      </div>
    </div>
  );
}
