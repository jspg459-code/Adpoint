import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toProxy(target: string, base: string) {
  try {
    return "/api/iptv-proxy?url=" + encodeURIComponent(new URL(target, base).toString());
  } catch {
    return target;
  }
}

function rewritePlaylist(text: string, sourceUrl: string) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Réécrit les URI des tags HLS (#EXT-X-KEY, #EXT-X-MAP, etc.).
      if (trimmed.startsWith("#")) {
        return line.replace(/URI=(?:"([^"]+)"|'([^']+)'|([^,\s]+))/g, (_m, a, b, c) => {
          const uri = a || b || c;
          return 'URI="' + toProxy(uri, sourceUrl) + '"';
        });
      }

      // Réécrit segments, playlists secondaires et chemins relatifs.
      return toProxy(trimmed, sourceUrl);
    })
    .join("\n");
}

function isPlaylist(type: string, url: URL, bodyStart?: string) {
  return (
    type.includes("mpegurl") ||
    type.includes("vnd.apple.mpegurl") ||
    /\.m3u8(?:$|[?#])/i.test(url.pathname) ||
    !!bodyStart?.trimStart().startsWith("#EXTM3U")
  );
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "URL manquante." }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
    if (!["http:", "https:"].includes(target.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "URL invalide." }, { status: 400 });
  }

  try {
    const upstreamHeaders = new Headers();
    upstreamHeaders.set("User-Agent", request.headers.get("user-agent") || "Mozilla/5.0");
    upstreamHeaders.set("Accept", request.headers.get("accept") || "*/*");

    // Certains flux HLS/fMP4 utilisent des requêtes partielles.
    const range = request.headers.get("range");
    if (range) upstreamHeaders.set("Range", range);

    const upstream = await fetch(target, {
      cache: "no-store",
      redirect: "follow",
      headers: upstreamHeaders,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: "Le serveur IPTV a répondu avec " + upstream.status + "." },
        { status: upstream.status || 502 }
      );
    }

    if (!upstream.body) {
      return NextResponse.json({ error: "Réponse IPTV vide." }, { status: 502 });
    }

    const type = upstream.headers.get("content-type") || "";

    // Une playlist est petite : on la lit et on réécrit toutes ses ressources
    // afin que Safari charge aussi segments, clés et sous-playlists via le proxy.
    if (isPlaylist(type, target)) {
      const playlist = await upstream.text();
      const rewritten = rewritePlaylist(playlist, upstream.url || target.toString());

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
          "Cache-Control": "no-store, no-cache",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Range, Content-Type",
        },
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", type || "application/octet-stream");
    headers.set("Cache-Control", "no-store");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");

    for (const name of ["content-length", "content-range", "content-encoding"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de joindre le flux IPTV." },
      { status: 502 }
    );
  }
}
