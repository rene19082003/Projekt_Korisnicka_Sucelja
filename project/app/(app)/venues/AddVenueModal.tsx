"use client";

import { useEffect } from "react";
import styles from "./AddVenueModal.module.css";
import AddVenueForm from "./AddVenueForm";
import type { Venue } from "./data";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (venue: Venue) => void;
};

export default function AddVenueModal({ open, onClose, onCreated }: Props) {
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onPointerDown={(e) => {
        // ✅ zatvori samo ako je klik stvarno na overlay (ne na sadržaj)
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Kreiraj novu lokaciju</h2>
            <p className={styles.subtitle}>
              Unesite osnovne podatke i odaberite sportove.
            </p>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Zatvori"
            type="button"
          >
            ✕
          </button>
        </div>

        <AddVenueForm
          onCancel={onClose}
          onCreated={(v) => {
            // samo proslijedi parentu; parent će zatvorit preko setAddOpen(false)
            onCreated(v);
          }}
        />
      </div>
    </div>
  );
}