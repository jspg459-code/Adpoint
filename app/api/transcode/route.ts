import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const base = process.env.IPTV_TRANSCODER_URL;
  const secret = process.env.IPTV_TRANSCODER_SECRET;

  if (!base || !secret) {
    return NextResponse.json(
      { error: "Le serveur de compatibilité vidéo n'est pas encore configuré." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const source = String(body?.source || "");
    const url = new URL(source);
    if (!["http:","https:"].includes(url.protocol)) {
      return NextResponse.json({ error: "Source invalide." }, { status: 400 });
    }

    const upstream = await fetch(base.replace(/\/+$/,"") + "/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + secret,
      },
      body: JSON.stringify({ source }),
      cache: "no-store",
    });

    const data = await upstream.json();
    if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

    const publicBase = process.env.IPTV_TRANSCODER_PUBLIC_URL || base;
    return NextResponse.json({
      id: data.id,
      url: publicBase.replace(/\/+$/,"") + data.url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de préparer le flux." },
      { status: 500 }
    );
  }
}
