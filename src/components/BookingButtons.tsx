import { useState } from "react";
import { Clock, MessageCircle, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

export type Slot = {
  id: string;
  time: string;
  service: string;
};

export default function BookingButtons({
  businessName,
  whatsapp,
  slots,
}: {
  businessName: string;
  whatsapp: string;
  slots: Slot[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());

  async function handleClick(slot: Slot) {
    setPendingId(slot.id);

    await supabase
      .from("bookings")
      .update({ status: "expired" })
      .lt("expires_at", new Date().toISOString())
      .eq("status", "pending");

    const { error } = await supabase.from("bookings").insert({
      slot_id: slot.id,
      status: "pending",
    });

    if (error) {
      if ((error as any).code === "23505") {
        setTakenIds((prev) => new Set(prev).add(slot.id));
        setPendingId(null);
        return;
      }
      alert("Não conseguimos reservar agora. Tenta de novo.");
      setPendingId(null);
      return;
    }

    const dateLabel = new Date(slot.time).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `Olá! Quero agendar ${slot.service} às ${dateLabel} na ${businessName}`;
    const phone = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    setPendingId(null);
  }

  return (
    <div style={styles.grid}>
      {slots.map((slot) => {
        const isTaken = takenIds.has(slot.id);
        const label = new Date(slot.time).toLocaleString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <button
            key={slot.id}
            disabled={isTaken || pendingId === slot.id}
            onClick={() => handleClick(slot)}
            className="af-slot"
            style={{ ...styles.slot, ...(isTaken ? styles.slotTaken : {}) }}
          >
            <span style={styles.slotTop}>
              <Clock size={14} strokeWidth={1.75} style={{ color: "var(--gold)" }} />
              <span style={styles.slotService}>{slot.service}</span>
            </span>
            <span style={styles.slotBottom}>
              {isTaken ? (
                <>
                  <Check size={13} strokeWidth={2} /> Acabou de ser reservado
                </>
              ) : (
                <>
                  {label}
                  <MessageCircle size={14} strokeWidth={1.75} style={styles.waIcon} />
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  },
  slot: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    padding: "14px 16px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-body)",
    transition: "border-color 0.15s ease, transform 0.15s ease",
  },
  slotTaken: { opacity: 0.4, cursor: "not-allowed" },
  slotTop: { display: "inline-flex", alignItems: "center", gap: 6 },
  slotService: { fontSize: 12.5, fontWeight: 600, color: "var(--gold)" },
  slotBottom: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 15,
    color: "var(--text)",
    fontWeight: 500,
  },
  waIcon: { color: "var(--neon)", marginLeft: "auto" },
};
