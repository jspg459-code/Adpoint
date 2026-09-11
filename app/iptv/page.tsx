"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Credentials = { server: string; username: string; password: string };
type Category = { category_id: string; category_name: string };
type Stream = { stream_id: number; name: string; stream_icon?: string; category_id?: string; stream_type?: string };

async function api(credentials: Credentials, action = "player_api", categoryId?: string) {
  const res = await fetch("/api/xtream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials, action, categoryId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur de connexion.");
  return json.data;
}

export default function IPTVPage() {
  const [credentials, setCredentials] = useState<Credentials>({ server: "", username: "", password: "" });
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selected, setSelected] = useState<Stream | null>(null);
  const [search, setSearch] = useState("");

  const normalizedServer = useMemo(() => credentials.server.trim().replace(/\/+$/, ""), [credentials.server]);

  async function connect() {
    setMessage("");
    if (!normalizedServer || !credentials.username.trim() || !credentials.password.trim()) {
      setMessage("Remplis tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const account = await api({ ...credentials, server: normalizedServer });
      if (!account?.user_info?.auth) throw new Error("Connexion refusée par le serveur.");
      const cats = await api({ ...credentials, server: normalizedServer }, "get_live_categories");
      setCategories(Array.isArray(cats) ? cats : []);
      const live = await api({ ...credentials, server: normalizedServer }, "get_live_streams");
      setStreams(Array.isArray(live) ? live : []);
      setConnected(true);
      setMessage("✅ Connecté. " + (Array.isArray(live) ? live.length : 0) + " chaînes chargées.");
    } catch (e) {
      setConnected(false);
      setMessage("❌ " + (e instanceof Error ? e.message : "Connexion impossible."));
    } finally {
      setLoading(false);
    }
  }

  async function chooseCategory(id: string) {
    setSelectedCategory(id);
    setLoading(true);
    try {
      const data = await api({ ...credentials, server: normalizedServer }, "get_live_streams", id);
      setStreams(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessage("❌ Impossible de charger cette catégorie.");
    } finally {
      setLoading(false);
    }
  }

  const visible = streams.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));
  const streamUrl = selected
    ? normalizedServer + "/live/" + encodeURIComponent(credentials.username) + "/" + encodeURIComponent(credentials.password) + "/" + selected.stream_id + ".m3u8"
    : "";

  return (
    <main className="dash" style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 18px 90px" }}>
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/iptv">IPTV</Link>
          <Link href="/profile">Mon profil</Link>
        </nav>
      </header>

      {!connected ? (
        <section className="profileBox" style={{ marginTop: 28, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
          <span className="eyebrow">XTREAM PLAYER</span>
          <h1>📺 Connecter mon service</h1>
          <p className="muted">Utilise uniquement un abonnement ou un serveur auquel tu es autorisé à accéder.</p>
          <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
            <input placeholder="https://mon-serveur.example:8080" value={credentials.server} onChange={(e) => setCredentials({ ...credentials, server: e.target.value })} />
            <input placeholder="Nom d’utilisateur" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} />
            <input type="password" placeholder="Mot de passe" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
            <button onClick={connect} disabled={loading}>{loading ? "Connexion…" : "🔌 Se connecter"}</button>
          </div>
          {message && <p className="notice" style={{ marginTop: 16 }}>{message}</p>}
        </section>
      ) : (
        <>
          <section className="profileBox" style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div><span className="eyebrow">EN DIRECT</span><h1 style={{ margin: "6px 0" }}>📺 IPTV Player</h1></div>
              <button onClick={() => { setConnected(false); setSelected(null); setStreams([]); }}>Déconnexion</button>
            </div>
            {selected ? (
              <div style={{ marginTop: 18 }}>
                <h2>{selected.name}</h2>
                <video controls autoPlay playsInline style={{ width: "100%", maxHeight: 650, background: "#000", borderRadius: 18 }} src={streamUrl} />
                <p className="muted" style={{ marginTop: 10 }}>Si ton navigateur ne lit pas le flux HLS directement, l’intégration HLS.js peut être ajoutée.</p>
              </div>
            ) : (
              <div style={{ marginTop: 18, minHeight: 280, borderRadius: 18, background: "#000", display: "grid", placeItems: "center" }}>
                <p>Choisis une chaîne pour commencer ▶️</p>
              </div>
            )}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, marginTop: 20 }}>
            <aside className="profileBox">
              <h2>Catégories</h2>
              <button onClick={async () => { setSelectedCategory(""); setLoading(true); try { const d = await api({ ...credentials, server: normalizedServer }, "get_live_streams"); setStreams(Array.isArray(d) ? d : []); } finally { setLoading(false); } }} style={{ width: "100%", marginBottom: 8 }}>Toutes les chaînes</button>
              <div style={{ display: "grid", gap: 8 }}>
                {categories.map((c) => <button key={c.category_id} onClick={() => chooseCategory(c.category_id)} style={{ textAlign: "left", opacity: selectedCategory === c.category_id ? 1 : 0.75 }}>{c.category_name}</button>)}
              </div>
            </aside>

            <section className="profileBox">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <h2>Chaînes {loading ? "⏳" : ""}</h2>
                <input placeholder="🔎 Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginTop: 18 }}>
                {visible.slice(0, 500).map((stream) => (
                  <button key={stream.stream_id} onClick={() => setSelected(stream)} style={{ padding: 0, overflow: "hidden", textAlign: "left" }}>
                    <div style={{ height: 110, background: "#111", display: "grid", placeItems: "center" }}>
                      {stream.stream_icon ? <img src={stream.stream_icon} alt="" style={{ maxWidth: "70%", maxHeight: 80, objectFit: "contain" }} /> : "📺"}
                    </div>
                    <div style={{ padding: 12, fontWeight: 700 }}>{stream.name}</div>
                  </button>
                ))}
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  );
}