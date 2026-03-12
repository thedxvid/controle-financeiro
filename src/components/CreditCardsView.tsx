import { CreditCard as CardIcon, Trash2, Calendar } from 'lucide-react';
import { CreditCard } from '../types';

interface Props {
  cards: CreditCard[];
  onDelete: (id: string) => void;
}

export default function CreditCardsView({ cards, onDelete }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Cartões de Crédito</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="bg-gradient-to-br from-zinc-800 to-zinc-950 p-6 rounded-2xl shadow-lg relative group text-white">
            <button 
              onClick={() => onDelete(card.id)}
              className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
              title="Excluir Cartão"
            >
              <Trash2 size={16} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <CardIcon size={24} className="text-zinc-400" />
              <h3 className="font-semibold text-lg tracking-wide">{card.name}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Limite Total</p>
                <p className="text-2xl font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase">Fechamento</p>
                    <p className="text-sm font-medium">Dia {card.closingDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase">Vencimento</p>
                    <p className="text-sm font-medium">Dia {card.dueDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
            <CardIcon size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nenhum cartão cadastrado</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Adicione seus cartões de crédito para acompanhar limites e vencimentos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
