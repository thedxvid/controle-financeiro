import { useState } from 'react';
import { X } from 'lucide-react';
import { Category, Transaction, Subscription, Investment, Budget, CreditCard } from '../types';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddTransaction: (t: Transaction) => void;
  onAddSubscription: (s: Subscription) => void;
  onAddInvestment: (i: Investment) => void;
  onAddBudget: (b: Budget) => void;
  onAddCreditCard: (c: CreditCard) => void;
}

export default function AddRecordModal({ isOpen, onClose, categories, onAddTransaction, onAddSubscription, onAddInvestment, onAddBudget, onAddCreditCard }: Props) {
  const [recordType, setRecordType] = useState<'transaction' | 'subscription' | 'investment' | 'budget' | 'card'>('transaction');
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const [investedAmount, setInvestedAmount] = useState('');
  const [investmentType, setInvestmentType] = useState('Renda Fixa');

  const [closingDate, setClosingDate] = useState('25');
  const [dueDate, setDueDate] = useState('5');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recordType === 'transaction') {
      onAddTransaction({
        id: Date.now().toString(),
        description,
        amount: Number(amount),
        type,
        category,
        date
      });
    } else if (recordType === 'subscription') {
      onAddSubscription({
        id: Date.now().toString(),
        name: description,
        amount: Number(amount),
        billingCycle,
        nextBillingDate: date,
        category: 'Assinaturas'
      });
    } else if (recordType === 'investment') {
      onAddInvestment({
        id: Date.now().toString(),
        name: description,
        amount: Number(amount),
        investedAmount: Number(investedAmount || amount),
        type: investmentType,
        date
      });
    } else if (recordType === 'budget') {
      onAddBudget({
        id: Date.now().toString(),
        category,
        amount: Number(amount)
      });
    } else if (recordType === 'card') {
      onAddCreditCard({
        id: Date.now().toString(),
        name: description,
        limit: Number(amount),
        closingDate: Number(closingDate),
        dueDate: Number(dueDate)
      });
    }
    
    setDescription('');
    setAmount('');
    setInvestedAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Adicionar Novo</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <div className="flex flex-wrap bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl mb-6 gap-1">
            <button
              onClick={() => setRecordType('transaction')}
              className={cn("flex-1 min-w-[30%] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors", recordType === 'transaction' ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}
            >
              Transação
            </button>
            <button
              onClick={() => setRecordType('subscription')}
              className={cn("flex-1 min-w-[30%] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors", recordType === 'subscription' ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}
            >
              Assinatura
            </button>
            <button
              onClick={() => setRecordType('investment')}
              className={cn("flex-1 min-w-[30%] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors", recordType === 'investment' ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}
            >
              Investimento
            </button>
            <button
              onClick={() => setRecordType('budget')}
              className={cn("flex-1 min-w-[30%] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors", recordType === 'budget' ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}
            >
              Meta
            </button>
            <button
              onClick={() => setRecordType('card')}
              className={cn("flex-1 min-w-[30%] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors", recordType === 'card' ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}
            >
              Cartão
            </button>
          </div>

          <form id="add-form" onSubmit={handleSubmit} className="space-y-4">
            {recordType === 'transaction' && (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button type="button" onClick={() => setType('income')} className={cn("py-2 border rounded-xl text-sm font-medium", type === 'income' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400")}>Receita</button>
                <button type="button" onClick={() => setType('expense')} className={cn("py-2 border rounded-xl text-sm font-medium", type === 'expense' ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400")}>Despesa</button>
              </div>
            )}

            {recordType !== 'budget' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {recordType === 'subscription' ? 'Nome do Serviço' : 
                   recordType === 'investment' ? 'Nome do Ativo' : 
                   recordType === 'card' ? 'Nome do Cartão (ex: Nubank)' : 'Descrição'}
                </label>
                <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500" placeholder={recordType === 'subscription' ? 'Ex: Netflix' : recordType === 'investment' ? 'Ex: Tesouro Direto' : 'Ex: Mercado'} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {recordType === 'investment' ? 'Valor Atual (R$)' : 
                   recordType === 'card' ? 'Limite (R$)' : 'Valor (R$)'}
                </label>
                <input required type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500" placeholder="0.00" />
              </div>
              {recordType !== 'budget' && recordType !== 'card' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{recordType === 'subscription' ? 'Próxima Cobrança' : 'Data'}</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500" />
                </div>
              )}
            </div>

            {(recordType === 'transaction' || recordType === 'budget') && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500">
                  {categories.filter(c => recordType === 'budget' ? c.type === 'expense' : (c.type === type || c.type === 'expense')).map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {recordType === 'card' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Dia de Fechamento</label>
                  <input required type="number" min="1" max="31" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500" placeholder="25" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Dia de Vencimento</label>
                  <input required type="number" min="1" max="31" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500" placeholder="5" />
                </div>
              </div>
            )}

            {recordType === 'subscription' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Ciclo de Cobrança</label>
                <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as 'monthly' | 'yearly')} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500">
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}

            {recordType === 'investment' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Valor Investido (R$)</label>
                  <input required type="number" step="0.01" min="0" value={investedAmount} onChange={e => setInvestedAmount(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Tipo de Ativo</label>
                  <select value={investmentType} onChange={e => setInvestmentType(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:focus:border-emerald-500">
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Renda Variável">Renda Variável</option>
                    <option value="Fundo Imobiliário">Fundo Imobiliário</option>
                    <option value="Criptomoedas">Criptomoedas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </>
            )}
          </form>
        </div>
        
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 pb-safe">
          <button type="submit" form="add-form" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-xl transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
