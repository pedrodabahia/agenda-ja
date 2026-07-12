// Lista central de tipos de negócio.
// Usado no formulário (Home) e na página pública (BusinessPage) —
// mantém os dois em sincronia automaticamente.
export const TYPE_LABELS: Record<string, string> = {
  barbearia: "Barbearia",
  salao_beleza: "Salão de Beleza",
  estetica: "Clínica de Estética",
  manicure: "Manicure / Nail Designer",
  massagem: "Spa / Massoterapia",
  academia: "Academia",
  personal: "Personal Trainer",
  estudio: "Estúdio (tatuagem, pilates, dança...)",
  clinica: "Clínica / Consultório",
  dentista: "Consultório Odontológico",
  fisioterapia: "Fisioterapia",
  pet_shop: "Pet Shop / Banho e Tosa",
  oficina: "Oficina Mecânica",
  fotografia: "Fotografia",
  outro: "Outro",
};

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS);
