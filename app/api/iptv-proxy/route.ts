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
  return text.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith("#")) {
      return line.replace(/URI="([^"]+)"/g, (_m, uri) => 'URI="' + toProxy(uri, sourceUrl) + '"');
    }

    return toProxy(trimmed, sourceUrl);
  }).join("\n");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "URL manquante." }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
    if (target.protocol !== "http:" && target.protocol !== "https:") throw new Error();
  } catch {
    return NextResponse.json({ error: "URL invalide." }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
        "Accept": request.headers.get("accept") || "*/*",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Le serveur IPTV a répondu avec " + upstream.status + "." }, { status: upstream.status || 502 });
    }

    const type = upstream.headers.get("content-type") || "";
    const looksLikePlaylist = type.includes("mpegurl") || target.pathname.toLowerCase().includes(".m3u8");

    if (looksLikePlaylist) {
      const playlist = await upstream.text();
      const rewritten = rewritePlaylist(playlist, upstream.url || target.toString());
      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", type || "application/octet-stream");
    headers.set("Cache-Control", "no-store");
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de joindre le flux IPTV." },
      { status: 502 }
    );
  }
}
