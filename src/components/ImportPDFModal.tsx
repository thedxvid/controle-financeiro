import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2, TrendingUp, TrendingDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Transaction } from '../types';
import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker to avoid Vite build complexity
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Step = 'upload' | 'processing' | 'review' | 'importing' | 'done' | 'error';

interface ParsedTransaction extends Omit<Transaction, 'id'> {
  selected: boolean;
  tempId: string;
}

interface BankSummary {
  total_found: number;
  bank_detected: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: (transactions: Transaction[]) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação':   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Transporte':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Moradia':       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Saúde':         'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'Lazer':         'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Educação':      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Assinaturas':   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Investimento':  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Salário':       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rendimentos':   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Freelance':     'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  'Outros':        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer',
  'Educação', 'Assinaturas', 'Investimento', 'Salário', 'Rendimentos',
  'Freelance', 'Outros',
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is (typeof item & { str: string }) => 'str' in item)
      .map(item => (item as { str: string }).str)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n');
}

export default function ImportPDFModal({ isOpen, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [summary, setSummary] = useState<BankSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (step === 'processing' || step === 'importing') return;
    setStep('upload');
    setTransactions([]);
    setSummary(null);
    setErrorMessage('');
    setFileName('');
    onClose();
  };

  const processFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setErrorMessage('Por favor, selecione um arquivo PDF válido.');
      setStep('error');
      return;
    }

    setFileName(file.name);
    setStep('processing');

    try {
      // Step 1: Extract text from PDF
      const text = await extractTextFromPDF(file);

      if (text.trim().length < 50) {
        throw new Error('O PDF parece estar vazio ou protegido. Certifique-se de que é um extrato em texto (não escaneado).');
      }

      // Step 2: Send to Edge Function for Claude to parse
      const { data, error } = await supabase.functions.invoke('parse-bank-statement', {
        body: { text },
      });

      if (error) throw new Error(error.message || 'Erro ao processar o extrato.');
      if (data?.error) throw new Error(data.error);
      if (!data?.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Nenhuma transação encontrada no extrato.');
      }

      const parsed: ParsedTransaction[] = data.transactions.map((t: Omit<Transaction, 'id'>, idx: number) => ({
        ...t,
        amount: Number(t.amount),
        selected: true,
        tempId: `parsed-${idx}-${Date.now()}`,
      }));

      setTransactions(parsed);
      setSummary(data.summary ?? null);
      setStep('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao processar o PDF.';
      setErrorMessage(msg);
      setStep('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const toggleSelect = (tempId: string) => {
    setTransactions(prev =>
      prev.map(t => t.tempId === tempId ? { ...t, selected: !t.selected } : t)
    );
  };

  const toggleAll = () => {
    const allSelected = transactions.every(t => t.selected);
    setTransactions(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const removeTransaction = (tempId: string) => {
    setTransactions(prev => prev.filter(t => t.tempId !== tempId));
  };

  const updateCategory = (tempId: string, category: string) => {
    setTransactions(prev =>
      prev.map(t => t.tempId === tempId ? { ...t, category } : t)
    );
    setEditingCategory(null);
  };

  const handleImport = async () => {
    const selected = transactions.filter(t => t.selected);
    if (selected.length === 0) return;

    setStep('importing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = selected.map(t => ({
        user_id: user!.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(rows)
        .select();

      if (error) throw error;

      const saved: Transaction[] = data.map((row: {
        id: string; date: string; description: string;
        amount: number; type: string; category: string;
      }) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: Number(row.amount),
        type: row.type as Transaction['type'],
        category: row.category,
      }));

      onImported(saved);
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar transações.';
      setErrorMessage(msg);
      setStep('error');
    }
  };

  const selectedCount = transactions.filter(t => t.selected).length;
  const totalIncome = transactions.filter(t => t.selected && t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.selected && t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Importar Extrato</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {step === 'upload' && 'Selecione o PDF do seu banco'}
                    {step === 'processing' && 'Analisando com IA...'}
                    {step === 'review' && `${transactions.length} transações encontradas`}
                    {step === 'importing' && 'Salvando transações...'}
                    {step === 'done' && 'Importação concluída!'}
                    {step === 'error' && 'Ocorreu um erro'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={step === 'processing' || step === 'importing'}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* STEP: Upload */}
              {step === 'upload' && (
                <div className="p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all',
                      isDragging
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/5'
                    )}
                  >
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                      isDragging ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-zinc-100 dark:bg-zinc-800'
                    )}>
                      <Upload size={28} className={isDragging ? 'text-emerald-500' : 'text-zinc-400'} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                        {isDragging ? 'Solte o arquivo aqui' : 'Arraste o PDF ou clique para selecionar'}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Extratos de qualquer banco brasileiro (Nubank, Itaú, Bradesco, Inter, BB, etc.)
                      </p>
                    </div>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full">
                      Apenas arquivos PDF em texto (não escaneados)
                    </span>
                  </div>
                </div>
              )}

              {/* STEP: Processing */}
              {step === 'processing' && (
                <div className="p-6 flex flex-col items-center justify-center gap-6 min-h-[280px]">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                      <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Processando {fileName}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      O Claude está lendo e categorizando suas transações...
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    {['Extraindo texto do PDF...', 'Identificando transações...', 'Categorizando automaticamente...'].map((label, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: Review */}
              {step === 'review' && (
                <div className="flex flex-col">
                  {/* Summary bar */}
                  <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                    {summary?.bank_detected && (
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        🏦 {summary.bank_detected}
                      </span>
                    )}
                    <div className="flex items-center gap-4 text-xs font-medium ml-auto">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={12} /> {formatCurrency(totalIncome)}
                      </span>
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                        <TrendingDown size={12} /> {formatCurrency(totalExpense)}
                      </span>
                      <span className="text-zinc-400">|</span>
                      <span className="text-zinc-600 dark:text-zinc-300">
                        <ArrowUpDown size={12} className="inline mr-1" />
                        {selectedCount} de {transactions.length} selecionadas
                      </span>
                    </div>
                  </div>

                  {/* Select all bar */}
                  <div className="px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={transactions.every(t => t.selected)}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Selecionar todas</span>
                  </div>

                  {/* Transactions list */}
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {transactions.map(t => (
                      <div
                        key={t.tempId}
                        className={cn(
                          'flex items-center gap-3 px-6 py-3 transition-colors',
                          !t.selected && 'opacity-40'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={t.selected}
                          onChange={() => toggleSelect(t.tempId)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">
                              {t.description}
                            </p>
                            {/* Category badge - clickable */}
                            <div className="relative">
                              <button
                                onClick={() => setEditingCategory(editingCategory === t.tempId ? null : t.tempId)}
                                className={cn(
                                  'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                  CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS['Outros']
                                )}
                              >
                                {t.category}
                                <ChevronDown size={9} />
                              </button>
                              {editingCategory === t.tempId && (
                                <div className="absolute top-6 left-0 z-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-1 w-44 max-h-48 overflow-y-auto">
                                  {CATEGORIES.map(cat => (
                                    <button
                                      key={cat}
                                      onClick={() => updateCategory(t.tempId, cat)}
                                      className={cn(
                                        'w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors',
                                        t.category === cat
                                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                                      )}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {formatDate(t.date)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn(
                            'text-sm font-semibold tabular-nums',
                            t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                          )}>
                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                          </span>
                          <button
                            onClick={() => removeTransaction(t.tempId)}
                            className="p-1 text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: Importing */}
              {step === 'importing' && (
                <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[220px]">
                  <Loader2 size={36} className="text-emerald-500 animate-spin" />
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    Salvando {selectedCount} transações...
                  </p>
                </div>
              )}

              {/* STEP: Done */}
              {step === 'done' && (
                <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[220px]">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg">Importação concluída!</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {selectedCount} transações adicionadas ao seu controle financeiro.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* STEP: Error */}
              {step === 'error' && (
                <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[220px]">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertCircle size={32} className="text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Ops! Algo deu errado</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => { setStep('upload'); setErrorMessage(''); }}
                    className="px-6 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-xl transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>

            {/* Footer (review step only) */}
            {step === 'review' && (
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-zinc-900">
                <button
                  onClick={() => { setStep('upload'); setTransactions([]); setFileName(''); }}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  ← Outro arquivo
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
                    selectedCount > 0
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  )}
                >
                  Importar {selectedCount} transaç{selectedCount === 1 ? 'ão' : 'ões'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
