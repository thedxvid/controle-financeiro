import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Wallet, LayoutDashboard, ListOrdered, CreditCard, TrendingUp, X, Plus, Target, CreditCard as CardIcon, Moon, Sun, LogOut, FileUp } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { INITIAL_CATEGORIES } from './constants';
import { Transaction, Category, Message, Subscription, Investment, Budget, CreditCard as CreditCardType } from './types';
import { sendMessageToCaixa } from './services/gemini';
import { cn } from './lib/utils';
import {
  fetchTransactions, insertTransaction, deleteTransaction,
  fetchSubscriptions, insertSubscription, deleteSubscription,
  fetchInvestments, insertInvestment, deleteInvestment,
  fetchBudgets, insertBudget, deleteBudget,
  fetchCreditCards, insertCreditCard, deleteCreditCard,
} from './services/database';

import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import SubscriptionsView from './components/SubscriptionsView';
import InvestmentsView from './components/InvestmentsView';
import BudgetsView from './components/BudgetsView';
import CreditCardsView from './components/CreditCardsView';
import AddRecordModal from './components/AddRecordModal';
import ImportPDFModal from './components/ImportPDFModal';

type Tab = 'dashboard' | 'transactions' | 'subscriptions' | 'investments' | 'budgets' | 'cards';

export default function App({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportPDFOpen, setIsImportPDFOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userEmail = session.user.email ?? '';
  const userInitial = (session.user.user_metadata?.full_name || userEmail).charAt(0).toUpperCase();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  // Carrega todos os dados do Supabase ao iniciar
  useEffect(() => {
    async function loadData() {
      setIsDataLoading(true);
      try {
        const [txs, subs, invs, bdg, ccs] = await Promise.all([
          fetchTransactions(),
          fetchSubscriptions(),
          fetchInvestments(),
          fetchBudgets(),
          fetchCreditCards(),
        ]);
        setTransactions(txs);
        setSubscriptions(subs);
        setInvestments(invs);
        setBudgets(bdg);
        setCreditCards(ccs);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsDataLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Eu sou o Caixa, seu assistente financeiro pessoal. Como posso ajudar você hoje? Você pode me perguntar sobre seus gastos, registrar transações, assinaturas ou investimentos.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToCaixa(
        userMessage.content,
        messages.filter(m => m.id !== 'welcome'),
        transactions,
        categories,
        subscriptions,
        investments
      );

      let finalContent = responseText;
      
      // Check for JSON block
      const jsonMatch = responseText.match(/<transaction_json>([\s\S]*?)<\/transaction_json>/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonStr = jsonMatch[1];
          const actionData = JSON.parse(jsonStr);
          
          if (actionData.action === 'create_transaction' && actionData.data) {
            const newTransaction: Transaction = {
              id: Date.now().toString(),
              type: actionData.data.type,
              amount: Number(actionData.data.amount),
              description: actionData.data.description,
              category: actionData.data.category_name,
              date: actionData.data.date || new Date().toISOString().split('T')[0],
            };
            setTransactions(prev => [...prev, newTransaction]);
          } else if (actionData.action === 'create_subscription' && actionData.data) {
            const newSub: Subscription = {
              id: Date.now().toString(),
              name: actionData.data.name,
              amount: Number(actionData.data.amount),
              billingCycle: actionData.data.billingCycle,
              nextBillingDate: actionData.data.nextBillingDate || new Date().toISOString().split('T')[0],
              category: actionData.data.category || 'Assinaturas',
            };
            setSubscriptions(prev => [...prev, newSub]);
          } else if (actionData.action === 'create_investment' && actionData.data) {
            const newInv: Investment = {
              id: Date.now().toString(),
              name: actionData.data.name,
              amount: Number(actionData.data.amount),
              investedAmount: Number(actionData.data.investedAmount || actionData.data.amount),
              type: actionData.data.type,
              date: actionData.data.date || new Date().toISOString().split('T')[0],
            };
            setInvestments(prev => [...prev, newInv]);
          }
          
          finalContent = responseText.replace(/<transaction_json>[\s\S]*?<\/transaction_json>/, '').trim();
        } catch (e) {
          console.error("Failed to parse JSON:", e);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ListOrdered },
    { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'budgets', label: 'Metas', icon: Target },
    { id: 'cards', label: 'Cartões', icon: CardIcon },
  ] as const;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shadow-sm z-10 hidden md:flex transition-colors duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Wallet size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Caixa</h1>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Icon size={18} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border",
              isAssistantOpen
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
            )}
          >
            <div className="flex items-center gap-3">
              <Bot size={18} className={isAssistantOpen ? "text-emerald-400" : "text-emerald-600"} />
              Assistente IA
            </div>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isAssistantOpen ? "bg-emerald-400" : "bg-emerald-500 animate-pulse"
            )} />
          </button>

          {/* User info + Logout */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Wallet size={16} />
            </div>
            <h1 className="font-semibold">Caixa</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400"
            >
              <Bot size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 z-30 pb-safe">
          <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 gap-1 items-center justify-between">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[64px] py-1.5 gap-1 rounded-xl transition-colors",
                    isActive 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <Icon size={20} className={isActive ? "fill-emerald-100 dark:fill-emerald-900/30" : ""} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-end gap-2 px-8 pt-8 max-w-6xl mx-auto w-full">
          <button
            onClick={() => setIsImportPDFOpen(true)}
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm text-sm"
          >
            <FileUp size={16} />
            Importar PDF
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Novo Registro
          </button>
        </div>

        <div className="p-4 md:p-8 md:pt-4 max-w-6xl mx-auto pb-24 md:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView 
              transactions={transactions} 
              subscriptions={subscriptions} 
              investments={investments} 
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsView 
              transactions={transactions} 
              onDelete={async (id) => { await deleteTransaction(id); setTransactions(prev => prev.filter(t => t.id !== id)); }} 
            />
          )}
          {activeTab === 'subscriptions' && (
            <SubscriptionsView 
              subscriptions={subscriptions} 
              onDelete={async (id) => { await deleteSubscription(id); setSubscriptions(prev => prev.filter(s => s.id !== id)); }} 
            />
          )}
          {activeTab === 'investments' && (
            <InvestmentsView 
              investments={investments} 
              onDelete={async (id) => { await deleteInvestment(id); setInvestments(prev => prev.filter(i => i.id !== id)); }} 
            />
          )}
          {activeTab === 'budgets' && (
            <BudgetsView 
              budgets={budgets} 
              transactions={transactions}
              onDelete={async (id) => { await deleteBudget(id); setBudgets(prev => prev.filter(b => b.id !== id)); }} 
            />
          )}
          {activeTab === 'cards' && (
            <CreditCardsView 
              cards={creditCards} 
              onDelete={async (id) => { await deleteCreditCard(id); setCreditCards(prev => prev.filter(c => c.id !== id)); }} 
            />
          )}
        </div>
      </main>

      {/* AI Assistant Panel (Right Sidebar) */}
      <AnimatePresence>
        {isAssistantOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Assistente Caixa</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Online e pronto para ajudar</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssistantOpen(false)}
                className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scroll-smooth bg-zinc-50/30 dark:bg-zinc-950/30">
              <div className="space-y-6">
                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[90%]",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                      msg.role === 'user' ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    
                    <div className={cn(
                      "px-4 py-3 rounded-2xl shadow-sm text-[14px] leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-sm" 
                        : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-tl-sm text-zinc-800 dark:text-zinc-200"
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="markdown-body prose prose-sm prose-zinc dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <span className={cn(
                        "text-[10px] mt-1.5 block opacity-60 font-medium",
                        msg.role === 'user' ? "text-zinc-300 dark:text-zinc-600 text-right" : "text-zinc-400 dark:text-zinc-500"
                      )}>
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 max-w-[90%]"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={14} />
                    </div>
                    <div className="px-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 pb-safe">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte ou registre algo..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 rounded-xl py-3 pl-4 pr-12 text-[14px] transition-all outline-none shadow-sm dark:text-zinc-100"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500 shadow-sm"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddRecordModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        categories={categories}
        onAddTransaction={async (t) => { const saved = await insertTransaction(t); setTransactions(prev => [saved, ...prev]); }}
        onAddSubscription={async (s) => { const saved = await insertSubscription(s); setSubscriptions(prev => [saved, ...prev]); }}
        onAddInvestment={async (i) => { const saved = await insertInvestment(i); setInvestments(prev => [saved, ...prev]); }}
        onAddBudget={async (b) => { const saved = await insertBudget(b); setBudgets(prev => [saved, ...prev]); }}
        onAddCreditCard={async (c) => { const saved = await insertCreditCard(c); setCreditCards(prev => [saved, ...prev]); }}
      />

      <ImportPDFModal
        isOpen={isImportPDFOpen}
        onClose={() => setIsImportPDFOpen(false)}
        onImported={(newTxs) => setTransactions(prev => [...newTxs, ...prev])}
      />
    </div>
  );
}
