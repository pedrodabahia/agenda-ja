import { useState } from "react";
import {
  Sparkles,
  Dumbbell,
  Phone,
  ListChecks,
  CalendarClock,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Copy,
} from "lucide-react";
import { supabase, slugify } from "../lib/supabase";

type Step = "form" | "loading" | "done" | "error";

const TYPE_LABELS: Record<string, string> = {
  barbearia: "Barbearia",
  academia: "Academia",
  estudio: "Estúdio",
  outro: "Outro",
};

type SlotDraft = {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultSlug, setResultSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("academia");
  const [whatsapp, setWhatsapp] = useState("");
  const [servicesText, setServicesText] = useState("");

  const [draftDate, setDraftDate] = useState("");
  const [draftHour, setDraftHour] = useState("07");
  const [draftMinute, setDraftMinute] = useState("00");
  const [slots, setSlots] = useState<SlotDraft[]>([]);

  function addSlot() {
    if (!draftDate) return;
    const id = `${draftDate}-${draftHour}-${draftMinute}-${Date.now()}`;
    const next = [...slots, { id, date: draftDate, time: `${draftHour}:${draftMinute}` }].sort(
      (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
    );
    setSlots(next);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (slots.length === 0) {
      setErrorMsg("Adiciona pelo menos 1 horário disponível antes de continuar.");
      setStep("error");
      return;
    }

    setStep("loading");

    const services = servicesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const isoSlots = slots.map((s) => new Date(`${s.date}T${s.time}:00`).toISOString());

    try {
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

      const { error: slotError } = await supabase.from("availability_slots").insert(
        isoSlots.map((s) => ({
          business_id: business.id,
          service_id: firstServiceId,
          slot_time: s,
        }))
      );
      if (slotError) throw slotError;

      setResultSlug(finalSlug);
      setStep("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Algo deu errado ao criar sua página. Tenta de novo.");
      setStep("error");
    }
  }

  const resultLink = `${window.location.origin}/${resultSlug}`;

  function handleCopy() {
    navigator.clipboard.writeText(resultLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={styles.main}>
      <div className="fade-up" style={{ ...styles.eyebrow, animationDelay: "0ms" }}>
        <Sparkles size={14} strokeWidth={1.75} />
        Agenda Já · plano grátis
      </div>

      <h1 className="fade-up" style={{ ...styles.h1, animationDelay: "60ms" }}>
        Sua agenda, <span style={styles.h1Accent}>num link</span>.
      </h1>

      <p className="fade-up" style={{ ...styles.lede, animationDelay: "120ms" }}>
        Preencha os dados do seu negócio. A gente gera uma página com seus
        horários — o cliente escolhe, e o WhatsApp já abre com a mensagem
        pronta.
      </p>

      {step !== "done" && (
        <form onSubmit={handleSubmit} className="fade-up" style={{ ...styles.form, animationDelay: "180ms" }}>
          <label style={styles.label}>
            <span style={styles.labelText}>
              <Dumbbell size={14} strokeWidth={1.75} /> Nome do negócio
            </span>
            <input
              required
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Academia Vida Ativa"
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Tipo</span>
            <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>
              <Phone size={14} strokeWidth={1.75} /> WhatsApp (com DDD)
            </span>
            <input
              required
              style={styles.input}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="11987654321"
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>
              <ListChecks size={14} strokeWidth={1.75} /> Serviços (separados por vírgula)
            </span>
            <input
              style={styles.input}
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
              placeholder="Musculação, Aula de spinning, Avaliação física"
            />
          </label>

          <div style={styles.slotSection}>
            <span style={styles.labelText}>
              <CalendarClock size={14} strokeWidth={1.75} /> Horários disponíveis
            </span>

            <div style={styles.slotPicker}>
              <input
                type="date"
                style={{ ...styles.input, flex: "1 1 140px" }}
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />
              <select
                style={{ ...styles.input, flex: "0 0 76px" }}
                value={draftHour}
                onChange={(e) => setDraftHour(e.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
              <select
                style={{ ...styles.input, flex: "0 0 76px" }}
                value={draftMinute}
                onChange={(e) => setDraftMinute(e.target.value)}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addSlot} className="af-add" style={styles.addButton}>
                <Plus size={16} strokeWidth={2} />
              </button>
            </div>

            {slots.length > 0 && (
              <div style={styles.chipRow}>
                {slots.map((s) => (
                  <span key={s.id} style={styles.chip}>
                    {new Date(`${s.date}T${s.time}:00`).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    · {s.time}
                    <button
                      type="button"
                      onClick={() => removeSlot(s.id)}
                      className="af-chip-x"
                      style={styles.chipRemove}
                      aria-label="Remover horário"
                    >
                      <X size={12} strokeWidth={2.25} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={step === "loading"} className="af-cta" style={styles.button}>
            {step === "loading" ? (
              <>
                <Loader2 size={16} className="spin" /> Criando sua página...
              </>
            ) : (
              <>
                Criar minha Agenda Já <ArrowRight size={16} strokeWidth={2} />
              </>
            )}
          </button>

          {step === "error" && <p style={styles.error}>{errorMsg}</p>}
        </form>
      )}

      {step === "done" && (
        <div className="fade-up" style={styles.result}>
          <div style={styles.resultIcon}>
            <CheckCircle2 size={22} strokeWidth={1.75} />
          </div>
          <p style={styles.resultLabel}>Sua página está no ar</p>
          <div style={styles.resultLinkRow}>
            <a href={`/${resultSlug}`} style={styles.resultLink}>
              {resultLink}
            </a>
            <button type="button" onClick={handleCopy} className="af-copy" style={styles.copyButton}>
              <Copy size={14} strokeWidth={1.75} />
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
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
  main: { maxWidth: 560, margin: "0 auto", padding: "72px 24px 96px" },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--gold)",
    fontWeight: 600,
    marginBottom: 18,
    padding: "6px 12px",
    border: "1px solid var(--border-strong)",
    borderRadius: 999,
    background: "var(--surface)",
  },
  h1: {
    fontFamily: "var(--font-display)",
    fontSize: 44,
    fontWeight: 700,
    lineHeight: 1.12,
    margin: "0 0 18px",
    color: "var(--text)",
    letterSpacing: "-0.01em",
  },
  h1Accent: {
    color: "var(--neon)",
  },
  lede: {
    fontFamily: "var(--font-body)",
    fontSize: 16,
    lineHeight: 1.6,
    color: "var(--text-dim)",
    marginBottom: 44,
    maxWidth: 460,
  },
  form: { display: "flex", flexDirection: "column", gap: 22 },
  label: { display: "flex", flexDirection: "column", gap: 8 },
  labelText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-dim)",
  },
  input: {
    fontSize: 15,
    padding: "13px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontWeight: 400,
    outline: "none",
  },
  slotSection: { display: "flex", flexDirection: "column", gap: 10 },
  slotPicker: { display: "flex", gap: 8, flexWrap: "wrap" },
  addButton: {
    flex: "0 0 44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    border: "1px solid var(--neon-dim)",
    background: "rgba(61, 255, 160, 0.1)",
    color: "var(--neon)",
    cursor: "pointer",
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text)",
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 999,
    padding: "6px 8px 6px 14px",
  },
  chipRemove: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "none",
    background: "var(--border-strong)",
    color: "var(--text-dim)",
    cursor: "pointer",
    padding: 0,
  },
  button: {
    marginTop: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "15px 22px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--neon-dim)",
    background: "linear-gradient(180deg, rgba(61,255,160,0.16), rgba(61,255,160,0.06))",
    color: "var(--neon)",
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    animation: "softPulse 2.6s ease-in-out infinite",
  },
  error: { fontFamily: "var(--font-body)", color: "var(--danger)", fontSize: 14 },
  result: {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius)",
    padding: 32,
  },
  resultIcon: {
    display: "inline-flex",
    color: "var(--neon)",
    marginBottom: 12,
  },
  resultLabel: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--text-dim)",
    margin: "0 0 10px",
  },
  resultLinkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  resultLink: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 600,
    color: "var(--gold)",
    textDecoration: "none",
    wordBreak: "break-all",
  },
  copyButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  },
  hint: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--text-faint)",
    marginTop: 18,
  },
};
