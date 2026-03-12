import { useState } from 'react';
import { Transaction } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsView({ transactions, onDelete }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const date = new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const type = t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Investimento';
        return `"${date}","${t.description}","${t.category}","${type}","${t.amount}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transacoes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Transações</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", 
                filter === 'all' ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('income')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", 
                filter === 'income' ? "bg-white dark:bg-zinc-800 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", 
                filter === 'expense' ? "bg-white dark:bg-zinc-800 shadow-sm text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Saídas
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.slice().reverse().map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        t.type === 'income' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : 
                        t.type === 'investment' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      )}>
                        {t.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      </div>
                      {t.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "font-semibold",
                      t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : 
                      t.type === 'investment' ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {t.type === 'income' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
