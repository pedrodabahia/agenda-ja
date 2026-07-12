import { useState } from "react";
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

    // Libera reservas "pending" expiradas antes de tentar reservar
    await supabase
      .from("bookings")
      .update({ status: "expired" })
      .lt("expires_at", new Date().toISOString())
      .eq("status", "pending");

    // A trava real contra double-booking é a constraint UNIQUE em
    // slot_id (schema.sql) — se já existir reserva ativa, o insert
    // abaixo falha com código 23505 (unique_violation).
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
            style={{ ...styles.slot, ...(isTaken ? styles.slotTaken : {}) }}
          >
            <span style={styles.slotService}>{slot.service}</span>
            <span style={styles.slotTime}>
              {isTaken ? "Acabou de ser reservado" : label}
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
    gap: 4,
    padding: "14px 16px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--line)",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "Inter, sans-serif",
  },
  slotTaken: { opacity: 0.45, cursor: "not-allowed" },
  slotService: { fontSize: 13, fontWeight: 600, color: "var(--brand-dark)" },
  slotTime: { fontSize: 15, color: "var(--ink)" },
};
