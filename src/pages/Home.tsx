import { useState } from "react";
import { supabase, slugify } from "../lib/supabase";

type Step = "form" | "loading" | "done" | "error";

const TYPE_LABELS: Record<string, string> = {
  barbearia: "Barbearia",
  academia: "Academia",
  estudio: "Estúdio",
  outro: "Outro",
};

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultSlug, setResultSlug] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("barbearia");
  const [whatsapp, setWhatsapp] = useState("");
  const [servicesText, setServicesText] = useState("Corte, Barba");
  const [slotsText, setSlotsText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("loading");
    setErrorMsg("");

    const services = servicesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const slots = slotsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => new Date(line.replace(" ", "T") + ":00").toISOString());

    try {
      // Garante slug único tentando "nome", "nome-2", "nome-3"...
      const baseSlug = slugify(name);
      if (!baseSlug) {
        setErrorMsg("Nome inválido pra gerar o link.");
        setStep("error");
        return;
      }

      let finalSlug = baseSlug;
      let attempt = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data: existing } = await supabase
          .from("businesses")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle();
        if (!existing) break;
        attempt += 1;
        finalSlug = `${baseSlug}-${attempt}`;
      }

      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .insert({ slug: finalSlug, name, type, whatsapp })
        .select()
        .single();

      if (bizError) throw bizError;

      let firstServiceId: string | null = null;
      if (services.length > 0) {
        const { data: serviceRows, error: svcError } = await supabase
          .from("services")
          .insert(services.map((s) => ({ business_id: business.id, name: s })))
          .select("id");
        if (svcError) throw svcError;
        firstServiceId = serviceRows?.[0]?.id ?? null;
      }

      if (slots.length > 0) {
        const { error: slotError } = await supabase.from("availability_slots").insert(
          slots.map((s) => ({
            business_id: business.id,
            service_id: firstServiceId,
            slot_time: s,
          }))
        );
        if (slotError) throw slotError;
      }

      setResultSlug(finalSlug);
      setStep("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Algo deu errado ao criar sua página. Tenta de novo.");
      setStep("error");
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.eyebrow}>agendaflow · plano grátis</div>
      <h1 style={styles.h1}>Sua agenda, num link, em 1 minuto.</h1>
      <p style={styles.lede}>
        Preencha os dados do seu negócio. A gente gera uma página com seus
        horários — o cliente clica e o WhatsApp já abre com a mensagem
        pronta.
      </p>

      {step !== "done" && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nome do negócio
            <input
              required
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Barbearia do João"
            />
          </label>

          <label style={styles.label}>
            Tipo
            <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            WhatsApp (com DDD)
            <input
              required
              style={styles.input}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="11987654321"
            />
          </label>

          <label style={styles.label}>
            Serviços (separados por vírgula)
            <input
              style={styles.input}
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
              placeholder="Corte, Barba, Sobrancelha"
            />
          </label>

          <label style={styles.label}>
            Horários disponíveis (um por linha, formato AAAA-MM-DD HH:MM)
            <textarea
              style={{ ...styles.input, height: 110, resize: "vertical" }}
              value={slotsText}
              onChange={(e) => setSlotsText(e.target.value)}
              placeholder={"2026-07-14 14:00\n2026-07-14 15:00\n2026-07-15 10:00"}
            />
          </label>

          <button type="submit" disabled={step === "loading"} style={styles.button}>
            {step === "loading" ? "Criando sua página..." : "Gerar minha página"}
          </button>

          {step === "error" && <p style={styles.error}>{errorMsg}</p>}
        </form>
      )}

      {step === "done" && (
        <div style={styles.result}>
          <p style={styles.resultLabel}>Sua página está no ar:</p>
          <a href={`/${resultSlug}`} style={styles.resultLink}>
            {window.location.origin}/{resultSlug}
          </a>
          <p style={styles.hint}>
            Compartilha esse link com seus clientes — no perfil do Instagram,
            no status do WhatsApp, onde fizer sentido.
          </p>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 560, margin: "0 auto", padding: "64px 24px 80px" },
  eyebrow: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--brand)",
    fontWeight: 600,
    marginBottom: 12,
  },
  h1: { fontSize: 40, lineHeight: 1.15, margin: "0 0 16px" },
  lede: {
    fontFamily: "Inter, sans-serif",
    fontSize: 16,
    lineHeight: 1.6,
    color: "#4a5650",
    marginBottom: 40,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  label: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "#3a453f",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  input: {
    fontSize: 15,
    padding: "12px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--ink)",
    fontWeight: 400,
  },
  button: {
    marginTop: 8,
    padding: "14px 20px",
    borderRadius: "var(--radius)",
    border: "none",
    background: "var(--brand)",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
  },
  error: { fontFamily: "Inter, sans-serif", color: "var(--danger)", fontSize: 14 },
  result: {
    background: "#fff",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 28,
  },
  resultLabel: { fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4a5650", margin: "0 0 8px" },
  resultLink: {
    display: "block",
    fontFamily: "Inter, sans-serif",
    fontSize: 17,
    fontWeight: 600,
    color: "var(--brand-dark)",
    textDecoration: "none",
    wordBreak: "break-all",
  },
  hint: { fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6b756f", marginTop: 16 },
};
