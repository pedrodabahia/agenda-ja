import { createClient } from "@supabase/supabase-js";

// No Vite, variáveis de ambiente expostas ao browser precisam
// começar com VITE_ (equivalente ao NEXT_PUBLIC_ do Next.js).
// A chave "anon" é feita pra ser pública — quem protege os dados
// são as policies de RLS no schema.sql, não o segredo da chave.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Mantido por compatibilidade — o slugify "de verdade" agora mora em
// ./slugify.ts (assim quem só precisa dele não carrega o Supabase junto).
export { slugify } from "./slugify";
