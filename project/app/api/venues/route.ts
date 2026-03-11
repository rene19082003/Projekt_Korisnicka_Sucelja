import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SportTip } from "@/components/common/ui/sportTypes";
import { SPORT_LABEL } from "@/components/common/ui/sportTypes";

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function parseSportovi(raw: unknown): SportTip[] {
  if (typeof raw !== "string") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const valid = parsed.filter(
    (s): s is SportTip => typeof s === "string" && s in SPORT_LABEL
  );
  return Array.from(new Set(valid));
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const cookieStore = await cookies();

    // ✅ 1) Anon client za auth (session cookies)
    const server = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });

    const {
      data: { user },
      error: userErr,
    } = await server.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
    }

    // ✅ 2) Service client samo za DB/storage
    const svc = createServiceClient(supabaseUrl, serviceKey);

    const form = await req.formData();

    const naziv = String(form.get("naziv") ?? "").trim();
    const adresa = String(form.get("adresa") ?? "").trim();
    const opis = String(form.get("opis") ?? "").trim();

    const sportoviRaw = form.get("sportovi");
    const sportovi = parseSportovi(sportoviRaw);

    if (!naziv || !adresa) {
      return NextResponse.json(
        { error: "Naziv i adresa su obavezni." },
        { status: 400 }
      );
    }

    if (sportovi.length === 0) {
      return NextResponse.json(
        { error: "Odaberite barem jedan sport." },
        { status: 400 }
      );
    }

    // Optional upload
    const file = form.get("file");
    let imageUrl = "/venues/default.jpg";

    if (file && typeof file !== "string") {
      const f = file as File;
      const ext = f.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${safeFileName(f.name || `image.${ext}`)}`;
      const path = `venues/${filename}`;
      const arrayBuffer = await f.arrayBuffer();

      const { data: upData, error: upErr } = await svc.storage
        .from("venue-image")
        .upload(path, Buffer.from(arrayBuffer), {
          contentType: f.type || "image/jpeg",
          upsert: false,
          cacheControl: "3600",
        });

      if (upErr) {
        return NextResponse.json(
          { error: `Upload slike nije uspio: ${upErr.message}` },
          { status: 400 }
        );
      }

      const { data: pub } = svc.storage
        .from("venue-image")
        .getPublicUrl(upData.path);

      imageUrl = pub.publicUrl;
    }

    const { data: inserted, error: insErr } = await svc
      .from("venues")
      .insert({
        naziv,
        adresa,
        opis,
        aktivnosti: sportovi, // ✅ array SportTip
        aktivni_eventovi: 0,
        autor_lokacije_id: user.id,
        slika: imageUrl,
      })
      .select("*")
      .single();

    if (insErr) {
      return NextResponse.json(
        { error: `Spremanje u bazu nije uspjelo: ${insErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ venue: inserted }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Neočekivana greška." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase
      .from("venues")
      .select("id,naziv,adresa,opis,slika,aktivnosti")
      .order("naziv", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const venues = (data ?? []).map((v) => ({
      id: v.id,
      naziv: v.naziv,
      adresa: v.adresa,
      opis: v.opis ?? "",
      sportovi: v.aktivnosti ?? [],
      aktivnosti: (v.aktivnosti ?? []).length,
      slika: v.slika ?? "/venues/default.jpg",
    }));

    return NextResponse.json({ venues }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Greška" }, { status: 500 });
  }
}