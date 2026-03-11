"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DeleteButton.module.css";
import { Trash2 } from "lucide-react";

export default function DeleteEventButton({ eventId }: { eventId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onDelete = async () => {
    console.log("eventId:", eventId, typeof eventId);
    setMsg("");

    const ok = window.confirm(
      "Jesi siguran da želiš obrisati ovaj termin? Ova radnja se ne može poništiti."
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push("/termini");
        router.refresh();
        return;
      }

      setMsg(data?.error ?? "Greška pri brisanju.");
    } catch {
      setMsg("Greška pri brisanju.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.deleteArea}>
      <button
        type="button"
        className={styles.deleteEventButton}
        onClick={onDelete}
        disabled={loading}
      >
        <Trash2 size={16} />
        {loading ? "Brisanje..." : "Obriši termin"}
      </button>

      {msg ? <p className={styles.deleteError}>{msg}</p> : null}
    </div>
  );
}