"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fluidPlayer?: (id: string, options?: any) => any;
  }
}

const SAMPLE_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";

export default function VideoTestPage() {
  const [vastUrl, setVastUrl] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Colle ton URL VAST AdCash puis lance le test.");
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("adpoints_vast_test_url");
    if (saved) setVastUrl(saved);

    if (window.fluidPlayer) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setStatus("Impossible de charger le lecteur vidéo.");
    document.head.appendChild(script);
  }, []);

  function startTest() {
    const url = vastUrl.trim();
    if (!url.startsWith("http")) {
      setStatus("Colle l’URL VAST complète générée par AdCash.");
      return;
    }
    if (!ready || !window.fluidPlayer) {
      setStatus("Le lecteur est encore en cours de chargement…");
      return;
    }

    localStorage.setItem("adpoints_vast_test_url", url);

    try {
      playerRef.current?.destroy?.();
    } catch {}

    setStatus("Test lancé : clique sur Lecture pour déclencher la publicité In-stream.");

    setTimeout(() => {
      try {
        playerRef.current = window.fluidPlayer?.("adpoints-vast-player", {
          layoutControls: {
            primaryColor: "#48c78e",
            posterImage: ""
          },
          vastOptions: {
            adList: [
              {
                roll: "preRoll",
                vastTag: url
              }
            ]
          }
        });
      } catch {
        setStatus("Erreur lors du lancement du lecteur. Vérifie que le lien est bien un VAST Tag.");
      }
    }, 50);
  }

  return (
    <main className="dash" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 18px 80px" }}>
      <div className="profileBox">
        <span className="eyebrow">TEST ADCASH</span>
        <h1>🎬 Test In-stream Video</h1>
        <p className="muted">
          Cette page sert uniquement à vérifier que la zone VAST AdCash diffuse correctement une publicité.
          Aucun AdPoint n’est distribué pendant ce test.
        </p>

        <label style={{ display: "block", marginTop: 24, fontWeight: 700 }}>URL VAST AdCash complète</label>
        <textarea
          value={vastUrl}
          onChange={(e) => setVastUrl(e.target.value)}
          placeholder="https://.../video/select.php?r=..."
          style={{ width: "100%", minHeight: 110, marginTop: 10, padding: 14, borderRadius: 12 }}
        />

        <button onClick={startTest} disabled={!ready} style={{ marginTop: 16 }}>
          {ready ? "▶ Lancer le test vidéo" : "Chargement du lecteur…"}
        </button>

        <p className="notice" style={{ marginTop: 18 }}>{status}</p>
      </div>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Lecteur de test</h2>
        <p className="muted">
          Clique sur Lecture. La publicité VAST doit apparaître avant la vidéo de démonstration.
        </p>
        <video
          id="adpoints-vast-player"
          controls
          playsInline
          style={{ width: "100%", maxHeight: 500, background: "#000", borderRadius: 16 }}
        >
          <source src={SAMPLE_VIDEO} type="video/mp4" />
        </video>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>⚠️ Important</h2>
        <p className="muted">
          Même si le test fonctionne, cette étape ne donne volontairement aucun AdPoint.
          Nous vérifierons ensuite comment détecter officiellement la fin ou le skip de la publicité avant d’ajouter une récompense.
        </p>
      </section>
    </main>
  );
}
