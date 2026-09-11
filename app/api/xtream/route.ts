import { NextRequest, NextResponse } from "next/server";

type Body = { server?: string; username?: string; password?: string; action?: string; categoryId?: string };

function base(server: string) {
  const url = server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) throw new Error("Adresse serveur invalide.");
  return url;
}

async function xtream(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Le serveur distant a répondu avec une erreur.");
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const server = base(body.server || "");
    const username = body.username?.trim() || "";
    const password = body.password?.trim() || "";
    if (!username || !password) return NextResponse.json({ error: "Identifiants manquants." }, { status: 400 });

    const params = new URLSearchParams({ username, password });
    const action = body.action || "player_api";

    if (action === "player_api") {
      const data = await xtream(server + "/player_api.php?" + params.toString());
      return NextResponse.json({ data });
    }

    params.set("action", action);
    if (body.categoryId) params.set("category_id", body.categoryId);
    const data = await xtream(server + "/player_api.php?" + params.toString());
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connexion impossible." },
      { status: 500 }
    );
  }
}