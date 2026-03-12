import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Caixa] Variáveis de ambiente do Supabase não encontradas.\n' +
    'Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.\n' +
    '• Local: arquivo .env na raiz do projeto\n' +
    '• Vercel: Settings → Environment Variables'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
