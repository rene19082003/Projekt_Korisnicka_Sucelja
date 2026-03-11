"use client";

import { useMemo, useState } from "react";
import styles from "./AddVenueForm.module.css";
import type { Venue } from "@/app/(app)/venues/data";
import { createVenue } from "@/app/(app)/venues/api";
import { SPORT_LABEL, type SportTip } from "@/components/common/ui/sportTypes";

type Props = {
  onCancel: () => void;             // zatvara modal
  onCreated: (venue: Venue) => void; // dodaje u listu
};

const SPORT_CATEGORIES: { title: string; items: SportTip[] }[] = [
  {
    title: "Najpopularniji",
    items: ["FOOTBALL", "BASKETBALL", "TENNIS", "RUNNING", "FITNESS", "SWIMMING", "VOLLEYBALL", "HANDBALL"],
  },
  {
    title: "Dvoranski i rekreativni",
    items: ["BADMINTON", "TABLE_TENNIS", "BOWLING", "BILLIARDS", "DARTS", "CHESS", "GYMNASTICS"],
  },
  {
    title: "Outdoor",
    items: ["CYCLING", "HIKING", "CLIMBING", "ROWING", "SKATING", "SKATEBOARD", "FRISBEE", "SLACKLINE", "ARCHERY"],
  },
  {
    title: "Wellness i pokret",
    items: ["YOGA", "PILATES", "TAI_CHI", "DANCE", "WORKOUT", "COMMUNITY"],
  },
  { title: "Borilački", items: ["MARTIAL_ARTS", "BOXING"] },
];

export default function AddVenueForm({ onCancel, onCreated }: Props) {
  const [naziv, setNaziv] = useState("");
  const [adresa, setAdresa] = useState("");
  const [opis, setOpis] = useState("");
  const [sportovi, setSportovi] = useState<SportTip[]>([]);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSport = (tip: SportTip) => {
    setSportovi((prev) => (prev.includes(tip) ? prev.filter((x) => x !== tip) : [...prev, tip]));
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SPORT_CATEGORIES;

    return SPORT_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((s) => SPORT_LABEL[s].toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [search]);

  const resetForm = () => {
    setNaziv("");
    setAdresa("");
    setOpis("");
    setSportovi([]);
    setSearch("");
    setFile(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!naziv.trim() || !adresa.trim()) {
      setError("Naziv i adresa su obavezni.");
      return;
    }

    if (sportovi.length === 0) {
      setError("Odaberite barem jedan sport.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const venue = await createVenue({
        naziv,
        adresa,
        opis,
        sportovi,
        file,
      });

      // ✅ 1) odmah dodaj u listu
      onCreated(venue);

      // ✅ 2) resetiraj formu da ne ostane “u starom stanju”
      resetForm();

      // ✅ 3) zatvori modal (ovo rješava "kliknem gumb i ništa se ne događa")
      onCancel();
    } catch (err: any) {
      setError(err?.message || "Greška");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Osnovno</h3>

        <input placeholder="Naziv lokacije" value={naziv} onChange={(e) => setNaziv(e.target.value)} />
        <input placeholder="Adresa" value={adresa} onChange={(e) => setAdresa(e.target.value)} />

        <textarea
          placeholder="Opis (opcionalno)"
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          rows={4}
        />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Sportovi</h3>

        <input
          className={styles.search}
          placeholder="Pretraži sport..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredCategories.map((cat) => (
          <div key={cat.title}>
            <div className={styles.categoryTitle}>{cat.title}</div>

            <div className={styles.sportGrid}>
              {cat.items.map((s) => {
                const selected = sportovi.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSport(s)}
                    className={`${styles.sportCard} ${selected ? styles.selected : ""}`}
                    disabled={loading}
                  >
                    {SPORT_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {sportovi.length > 0 && (
          <div className={styles.selectedList}>
            {sportovi.map((s) => (
              <span key={s} className={styles.tag}>
                {SPORT_LABEL[s]}
                <button type="button" onClick={() => toggleSport(s)} disabled={loading}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Slika</h3>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={loading}
        />
      </section>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.secondary} disabled={loading}>
          Odustani
        </button>

        <button type="submit" className={styles.primary} disabled={loading}>
          {loading ? "Spremam..." : "Spremi lokaciju"}
        </button>
      </div>
    </form>
  );
}