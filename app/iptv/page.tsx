"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type XtreamCredentials = {
  server: string;
  username: string;
  password: string;
};

export default function IPTVPage() {
  const [credentials, setCredentials] = useState<XtreamCredentials>({
    server: "",
    username: "",
    password: "",
  });
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedServer = useMemo(
    () => credentials.server.trim().replace(/\/+$/, ""),
    [credentials.server]
  );

  function connect() {
    setMessage("");
    if (!normalizedServer || !credentials.username.trim() || !credentials.password.trim()) {
      setMessage("Remplis l’adresse du serveur, le nom d’utilisateur et le mot de passe.");
      return;
    }

    // The credentials stay in the browser in this prototype.
    setConnected(true);
    setMessage("Connexion configurée. La récupération des contenus sera ajoutée via une API serveur sécurisée.");
  }

  return (
    <main className="dash" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 18px 90px" }}>
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/iptv">IPTV</Link>
          <Link href="/profile">Mon profil</Link>
        </nav>
      </header>

      <section className="profileBox" style={{ marginTop: 28 }}>
        <span className="eyebrow">LECTEUR XTREAM</span>
        <h1>📺 Mon lecteur vidéo</h1>
        <p className="muted">
          Connecte un service Xtream Codes auquel tu es autorisé à accéder.
        </p>

        <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
          <input
            placeholder="Adresse du serveur — ex. https://serveur.example"
            value={credentials.server}
            onChange={(e) => setCredentials({ ...credentials, server: e.target.value })}
          />
          <input
            placeholder="Nom d’utilisateur"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          <button onClick={connect}>🔌 Se connecter</button>
        </div>

        {message && <p className="notice" style={{ marginTop: 16 }}>{message}</p>}
      </section>

      {connected && (
        <section className="profileBox" style={{ marginTop: 24 }}>
          <h2>🎬 Lecteur</h2>
          <div style={{
            marginTop: 16,
            minHeight: 320,
            borderRadius: 18,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center"
          }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>Connexion Xtream configurée</h3>
              <p className="muted">Serveur : {normalizedServer}</p>
              <p className="muted">La prochaine étape sera de charger les catégories et contenus autorisés via le serveur.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}