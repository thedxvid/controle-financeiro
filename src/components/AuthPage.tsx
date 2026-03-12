import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(translateError(error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setError(translateError(error.message));
      else setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(translateError(error.message));
      else setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } finally {
      setIsLoading(false);
    }
  };

  const translateError = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Email rate limit exceeded')) return 'Muitas tentativas. Aguarde alguns minutos.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    return msg;
  };

  const titles = {
    login: { title: 'Bem-vindo de volta', sub: 'Entre na sua conta para continuar' },
    register: { title: 'Criar conta', sub: 'Comece a controlar suas finanças hoje' },
    forgot: { title: 'Recuperar senha', sub: 'Enviaremos um link para seu e-mail' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Caixa</h1>
          <p className="text-emerald-400/70 text-sm mt-1">Controle Financeiro Inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">{titles[mode].title}</h2>
                <p className="text-zinc-400 text-sm mt-1">{titles[mode].sub}</p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Nome completo</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Seu nome"
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wide">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-500 text-sm outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); resetForm(); }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                    "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' && 'Entrar'}
                      {mode === 'register' && 'Criar conta'}
                      {mode === 'forgot' && 'Enviar link'}
                    </>
                  )}
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 text-center text-sm">
                {mode === 'login' && (
                  <p className="text-zinc-500">
                    Não tem conta?{' '}
                    <button onClick={() => { setMode('register'); resetForm(); }} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      Criar grátis
                    </button>
                  </p>
                )}
                {mode === 'register' && (
                  <p className="text-zinc-500">
                    Já tem conta?{' '}
                    <button onClick={() => { setMode('login'); resetForm(); }} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      Entrar
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <button onClick={() => { setMode('login'); resetForm(); }} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                    ← Voltar ao login
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Seus dados são protegidos com criptografia de ponta a ponta
        </p>
      </motion.div>
    </div>
  );
}
