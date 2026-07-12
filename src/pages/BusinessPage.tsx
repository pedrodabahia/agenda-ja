import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, MapPin, CalendarX2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import BookingButtons, { Slot } from "../components/BookingButtons";

const TYPE_LABELS: Record<string, string> = {
  barbearia: "Barbearia",
  academia: "Academia",
  estudio: "Estúdio",
  outro: "Negócio",
};

type Business = {
  id: string;
  name: string;
  type: string;
  whatsapp: string;
};

export default function BusinessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    if (!slug) return;

    (async () => {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, type, whatsapp")
        .eq("slug", slug)
        .maybeSingle();

      if (!biz) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBusiness(biz);

      const { data: slotRows } = await supabase
        .from("availability_slots")
        .select("id, slot_time, services(name)")
        .eq("business_id", biz.id)
        .gte("slot_time", new Date().toISOString())
        .order("slot_time", { ascending: true });

      const { data: activeBookings } = await supabase
        .from("bookings")
        .select("slot_id")
        .in("status", ["pending", "confirmed"]);

      const bookedIds = new Set((activeBookings ?? []).map((b) => b.slot_id));

      const available = (slotRows ?? [])
        .filter((s: any) => !bookedIds.has(s.id))
        .map((s: any) => ({
          id: s.id,
          time: s.slot_time,
          service: s.services?.name ?? "Atendimento",
        }));

      setSlots(available);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={styles.loadingRow}>
          <Loader2 size={18} className="spin" style={{ color: "var(--neon)" }} />
          <span style={styles.lede}>Carregando...</span>
        </div>
      </main>
    );
  }

  if (notFound || !business) {
    return (
      <main style={styles.main}>
        <div className="fade-up" style={styles.notFoundIcon}>
          <MapPin size={22} strokeWidth={1.75} />
        </div>
        <h1 style={styles.h1}>Página não encontrada</h1>
        <p style={styles.lede}>Confere se o link tá certo.</p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div className="fade-up" style={{ ...styles.eyebrow, animationDelay: "0ms" }}>
        {TYPE_LABELS[business.type] ?? "Negócio"}
      </div>
      <h1 className="fade-up" style={{ ...styles.h1, animationDelay: "60ms" }}>
        {business.name}
      </h1>
      <p className="fade-up" style={{ ...styles.lede, animationDelay: "120ms" }}>
        Escolha um horário abaixo pra agendar direto pelo WhatsApp.
      </p>

      {slots.length === 0 ? (
        <div className="fade-up" style={{ ...styles.empty, animationDelay: "160ms" }}>
          <CalendarX2 size={18} strokeWidth={1.75} style={{ color: "var(--text-dim)" }} />
          Nenhum horário disponível no momento. Volte mais tarde ou chame
          direto no WhatsApp.
        </div>
      ) : (
        <div className="fade-up" style={{ animationDelay: "160ms" }}>
          <BookingButtons businessName={business.name} whatsapp={business.whatsapp} slots={slots} />
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 560, margin: "0 auto", padding: "72px 24px 96px" },
  eyebrow: {
    display: "inline-block",
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--gold)",
    fontWeight: 600,
    marginBottom: 16,
    padding: "6px 12px",
    border: "1px solid var(--border-strong)",
    borderRadius: 999,
    background: "var(--surface)",
  },
  h1: {
    fontFamily: "var(--font-display)",
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.15,
    margin: "0 0 14px",
  },
  lede: {
    fontFamily: "var(--font-body)",
    fontSize: 16,
    color: "var(--text-dim)",
    marginBottom: 36,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "var(--font-body)",
    color: "var(--text-dim)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: 18,
  },
  loadingRow: { display: "flex", alignItems: "center", gap: 10 },
  notFoundIcon: { color: "var(--gold)", marginBottom: 10 },
};
