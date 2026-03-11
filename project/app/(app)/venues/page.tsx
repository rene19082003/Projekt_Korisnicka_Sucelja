"use client";

import { useState, useEffect, useMemo } from "react";
import { MapPin, ArrowRight, ArrowLeft, Eye, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./venues.module.css";
import AddVenueModal from "./AddVenueModal";
import { getVenues, type Venue } from "./data";
import { createClient } from "@/lib/supabase/client";

import type { SportTip } from "@/components/common/ui/sportTypes";
import { SPORT_LABEL } from "@/components/common/ui/sportTypes";


import { useAuth } from "@/app/authentication/auth/AuthContext";

export default function VenuesPage() {
  const supabase = useMemo(() => createClient(), []);

  const { user, isAdmin, loading: authLoading } = useAuth();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState("");

  const [canCreateVenue, setCanCreateVenue] = useState(false);
  const [permLoading, setPermLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);

  // ✅ učitaj venues
  useEffect(() => {
    const load = async () => {
      const data = await getVenues();
      setVenues(data);
    };
    load();
  }, []);

  const userId = user?.id ?? null;

useEffect(() => {
  const loadPerm = async () => {
    if (authLoading) {
      setPermLoading(true);
      return;
    }

    if (!userId) {
      setCanCreateVenue(false);
      setPermLoading(false);
      return;
    }

    // ✅ ako već znaš da može kreirati, nemoj zaključat UI dok refetch-aš
    if (canCreateVenue || isAdmin) {
      // možeš čak i preskočiti refetch ovdje
      setPermLoading(false);
      return;
    }

    setPermLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("can_create_venue")
      .eq("id", userId)
      .maybeSingle();

    if (!error) setCanCreateVenue(!!data?.can_create_venue);

    setPermLoading(false);
  };

  loadPerm();
}, [authLoading, userId, supabase, canCreateVenue, isAdmin]);

  // ✅ helper za label sporta
  const sportLabel = (s: string) => {
    const key = s as SportTip;
    return SPORT_LABEL[key] ?? s;
  };

  // ✅ filter
  const filtered = venues.filter((v) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    return (
      v.naziv.toLowerCase().includes(q) ||
      v.adresa.toLowerCase().includes(q) ||
      v.sportovi.some((s) => sportLabel(s).toLowerCase().includes(q))
    );
  });

  // ✅ paginacija
  const [currentPage, setCurrentPage] = useState(1);
  const limitItems = 9;
  const totalPages = Math.ceil(filtered.length / limitItems);
  const start = (currentPage - 1) * limitItems;
  const items = filtered.slice(start, start + limitItems);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const canShowCreateBtn = isAdmin || canCreateVenue;

  return (
    <main className={styles.page}>
      <div className={styles.headerTop}>
        <div>
          <h1>Lokacije</h1>
          <p>
            Istraži sportske lokacije u gradu i pronađi savršeno mjesto za svoju
            sljedeću aktivnost.
          </p>
        </div>

        {/* ✅ gumb više ne “nestaje” random */}
        {canShowCreateBtn && (
          <button
            onClick={() => setAddOpen(true)}
            className={styles.createBtn}
            disabled={authLoading}
            aria-disabled={authLoading}
            title={authLoading ? "Učitavam..." : "Dodaj lokaciju"}
          >
            <Plus className={styles.plus} />
            Dodaj lokaciju
          </button>
        )}

        <div className={styles.searchWrapper}>
          <label htmlFor="search-venues">Pretraži lokacije</label>
          <input
            id="search-venues"
            type="text"
            placeholder="Pretraži po imenu, adresi ili sportu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <h3>Nema rezultata</h3>
          <p>Pokušajte s drugim pojmom za pretragu.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((venue) => (
            <div key={venue.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <Image
                  src={venue.slika}
                  alt={venue.naziv}
                  width={400}
                  height={200}
                  className={styles.image}
                />
                <span className={styles.sportCount}>
                  {venue.aktivnosti}{" "}
                  {venue.aktivnosti === 1 ? "aktivnost" : "aktivnosti"}
                </span>
              </div>

              <div className={styles.cardBody}>
                <h4 className={styles.naziv}>{venue.naziv}</h4>

                <div className={styles.adresa}>
                  <MapPin />
                  <span>{venue.adresa}</span>
                </div>

                <p className={styles.opis}>{venue.opis}</p>

                <div className={styles.sportTags}>
                  {venue.sportovi.map((sport) => (
                    <span key={sport} className={styles.sportTag}>
                      {sportLabel(sport)}
                    </span>
                  ))}
                </div>

                <div className={styles.detailsButton}>
                  <Link href={`/venues/${venue.id}`}>
                    <Eye size={18} />
                    Pogledaj lokaciju
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.side}>
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                className={styles.pageButton}
              >
                <ArrowLeft /> Prethodna
              </button>
            )}
          </div>

          <p className={styles.pageInfo}>
            Stranica {currentPage} od {totalPages}
          </p>

          <div className={styles.side}>
            {currentPage < totalPages && (
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className={styles.pageButton}
              >
                Sljedeća <ArrowRight />
              </button>
            )}
          </div>
        </div>
      )}

      <AddVenueModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(newVenue) => {
          setVenues((prev) => [newVenue, ...prev]);
          setAddOpen(false);
        }}
        
      />
    </main>
  );
}