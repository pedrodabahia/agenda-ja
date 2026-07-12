import { createClient } from "@supabase/supabase-js";

// No Vite, variáveis de ambiente expostas ao browser precisam
// começar com VITE_ (equivalente ao NEXT_PUBLIC_ do Next.js).
// A chave "anon" é feita pra ser pública — quem protege os dados
// são as policies de RLS no schema.sql, não o segredo da chave.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Gera um slug limpo a partir do nome do negócio
// "Barbearia do João!" -> "barbearia-do-joao"
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
