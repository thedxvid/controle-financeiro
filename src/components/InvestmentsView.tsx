import { Investment } from '../types';
import { TrendingUp, Trash2, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface Props {
  investments: Investment[];
  onDelete: (id: string) => void;
}

export default function InvestmentsView({ investments, onDelete }: Props) {
  const totalInvested = investments.reduce((acc, inv) => acc + inv.investedAmount, 0);
  const currentTotal = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const profit = currentTotal - totalInvested;
  const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  const allocationByType = investments.reduce((acc, inv) => {
    acc[inv.type] = (acc[inv.type] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(allocationByType).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Investimentos</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1">Patrimônio Atual</p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentTotal)}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1">Total Investido</p>
          <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1">Rendimento</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-semibold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
              {profit >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}
            </p>
            <span className={`text-sm font-medium ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
              ({profit >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Meus Ativos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                <tr>
                  <th className="px-5 py-3">Ativo</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3 text-right">Investido</th>
                  <th className="px-5 py-3 text-right">Atual</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {investments.map((inv) => {
                  const itemProfit = inv.amount - inv.investedAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 group">
                      <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-blue-500" />
                          {inv.name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{inv.type}</td>
                      <td className="px-5 py-4 text-right text-zinc-500 dark:text-zinc-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.investedAmount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.amount)}
                        </div>
                        <div className={`text-xs ${itemProfit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                          {itemProfit >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemProfit)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => onDelete(inv.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {investments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      Nenhum investimento registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <PieChartIcon size={18} className="text-zinc-400" />
            Alocação por Tipo
          </h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-48 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
              <div className="w-full space-y-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-600 dark:text-zinc-400">{entry.name}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {((entry.value / currentTotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
              Sem dados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
