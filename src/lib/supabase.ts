import { createClient } from '@supabase/supabase-js';

// Estas credenciais são públicas por design (anon key do Supabase).
// A segurança dos dados é garantida pelas políticas RLS no banco de dados.
const supabaseUrl = 'https://oftsmnmshzvkgllwqhiy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdHNtbm1zaHp2a2dsbHdxaGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjIyNjQsImV4cCI6MjA4ODg5ODI2NH0.RFwJ0bFIQNxD2FdRRkVcIEneFlKDoXn44d0ansHWuf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
