"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./venueDetail.module.css";
import { Trash2 } from "lucide-react";

export default function DeleteVenueButton({
  venueId,
  disabled,
}: {
  venueId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const onDelete = async () => {
    setMsg("");

    const ok = window.confirm(
      "Jesi siguran da želiš obrisati ovu lokaciju? Ova radnja se ne može poništiti."
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // ✅ dovoljno je samo push (bez refresh)
        router.push("/venues");
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
    <div className={styles.deleteSection}>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={onDelete}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        title={
          disabled
            ? "Ne možeš obrisati lokaciju jer ima barem jedan termin."
            : "Obriši lokaciju"
        }
      >
        <Trash2 size={16} />
        {loading ? "Brisanje..." : "Obriši lokaciju"}
      </button>

      {disabled ? (
        <p className={styles.deleteHint}>
          Lokaciju možeš obrisati tek kad nema nijedan termin na njoj.
        </p>
      ) : (
        <p className={styles.deleteHint}>
          Brisanje je dopušteno samo adminu ili autoru lokacije.
        </p>
      )}

      {msg ? <p className={styles.deleteError}>{msg}</p> : null}
    </div>
  );
}