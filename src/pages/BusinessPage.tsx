import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    return <main style={styles.main}><p style={styles.lede}>Carregando...</p></main>;
  }

  if (notFound || !business) {
    return (
      <main style={styles.main}>
        <h1 style={styles.h1}>Página não encontrada</h1>
        <p style={styles.lede}>Confere se o link tá certo.</p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.eyebrow}>{TYPE_LABELS[business.type] ?? "Negócio"}</div>
      <h1 style={styles.h1}>{business.name}</h1>
      <p style={styles.lede}>Escolha um horário abaixo pra agendar direto pelo WhatsApp.</p>

      {slots.length === 0 ? (
        <p style={styles.empty}>
          Nenhum horário disponível no momento. Volte mais tarde ou chame
          direto no WhatsApp.
        </p>
      ) : (
        <BookingButtons businessName={business.name} whatsapp={business.whatsapp} slots={slots} />
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
  h1: { fontSize: 36, lineHeight: 1.15, margin: "0 0 12px" },
  lede: { fontFamily: "Inter, sans-serif", fontSize: 16, color: "#4a5650", marginBottom: 32 },
  empty: { fontFamily: "Inter, sans-serif", color: "#6b756f" },
};
