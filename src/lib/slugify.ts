// Gera um slug limpo a partir do nome do negócio
// "Barbearia do João!" -> "barbearia-do-joao"
//
// Fica num arquivo separado do cliente Supabase de propósito: assim
// a página inicial pode usar o slugify sem precisar carregar (nem
// inicializar) o cliente Supabase antes da hora.
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
