"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fluidPlayer?: (id: string, options?: any) => any;
  }
}

const SAMPLE_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const DEFAULT_VAST_URL = "https://youradexchange.com/video/select.php?r=1213948";

type Diagnostic = {
  state: "idle" | "loading" | "success" | "warning" | "error";
  title: string;
  detail: string;
};

export default function VideoTestPage() {
  const [vastUrl, setVastUrl] = useState(DEFAULT_VAST_URL);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Lecteur prêt : lance le test puis clique sur Lecture.");
  const [diagnostic, setDiagnostic] = useState<Diagnostic>({
    state: "idle",
    title: "Test prêt",
    detail: "Le lecteur utilisera le tag VAST In-stream AdCash comme pré-roll avant la vidéo de démonstration."
  });

  const playerRef = useRef<any>(null);
  const adStartedRef = useRef(false);
  const adFinishedRef = useRef(false);

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
    script.onerror = () => {
      setReady(false);
      setStatus("Impossible de charger Fluid Player.");
      setDiagnostic({
        state: "error",
        title: "Lecteur indisponible",
        detail: "Fluid Player n’a pas pu être chargé."
      });
    };
    document.head.appendChild(script);
  }, []);

  function startTest() {
    const url = vastUrl.trim();

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setStatus("Colle l’URL VAST complète générée par AdCash.");
      setDiagnostic({
        state: "error",
        title: "URL invalide",
        detail: "Le lien doit commencer par http:// ou https://."
      });
      return;
    }

    if (!ready || !window.fluidPlayer) {
      setStatus("Le lecteur est encore en cours de chargement…");
      return;
    }

    localStorage.setItem("adpoints_vast_test_url", url);
    adStartedRef.current = false;
    adFinishedRef.current = false;

    try {
      playerRef.current?.destroy?.();
    } catch {}

    setStatus("Test VAST lancé : la publicité doit être demandée avant la vidéo.");
    setDiagnostic({
      state: "loading",
      title: "Demande publicitaire en cours",
      detail: "Le tag VAST est envoyé au lecteur. Clique sur Lecture pour déclencher le pré-roll."
    });

    const video = document.getElementById("adpoints-vast-player") as HTMLVideoElement | null;
    if (!video) return;

    // Réinitialise complètement la vidéo de contenu avant de recréer le player.
    video.pause();
    video.currentTime = 0;
    video.load();

    // Si le contenu démarre directement sans qu'une publicité n'ait été détectée,
    // le test l'indique clairement au lieu de faire croire que la vidéo principale
    // est une publicité.
    const handleContentPlay = () => {
      if (!adStartedRef.current) {
        setStatus("⚠️ La vidéo de démonstration a démarré directement.");
        setDiagnostic({
          state: "warning",
          title: "Pré-roll non observé",
          detail: "Aucune publicité VAST n’a été détectée avant la vidéo. Cela peut indiquer un No Fill, une zone inactive, une campagne non disponible ou une incompatibilité du tag pour cette requête."
        });
      } else if (adFinishedRef.current) {
        setStatus("🟢 Publicité terminée, puis vidéo de démonstration lancée.");
      }
    };

    video.addEventListener("play", handleContentPlay, { once: true });

    setTimeout(() => {
      try {
        // Configuration officielle minimale Fluid Player + VAST pre-roll.
        // On laisse Fluid Player gérer directement la requête VAST et le rendu.
        playerRef.current = window.fluidPlayer?.("adpoints-vast-player", {
          layoutControls: {
            primaryColor: "#48c78e",
            playButtonShowing: true,
            autoPlay: false,
            mute: false,
            allowDownload: false,
            playbackRateEnabled: false,
            allowTheatre: true,
            miniPlayer: { enabled: false }
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

        setStatus("Test prêt : clique sur Lecture. Le pré-roll AdCash doit passer avant la vidéo.");
      } catch (error) {
        setStatus("Erreur lors du lancement du lecteur.");
        setDiagnostic({
          state: "error",
          title: "Impossible de lancer le test",
          detail: error instanceof Error ? error.message : "Erreur inconnue."
        });
      }
    }, 100);
  }

  const diagnosticColor =
    diagnostic.state === "success" ? "#48c78e" :
    diagnostic.state === "warning" ? "#f0b429" :
    diagnostic.state === "error" ? "#ef6b6b" :
    "#9fb0c8";

  return (
    <main className="dash" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 18px 80px" }}>
      <div className="profileBox">
        <span className="eyebrow">TEST ADCASH</span>
        <h1>🎬 Test In-stream Video</h1>
        <p className="muted">
          Test technique du tag VAST AdCash. Aucun AdPoint n’est distribué pendant ce test.
        </p>

        <label style={{ display: "block", marginTop: 24, fontWeight: 700 }}>
          URL VAST AdCash complète
        </label>

        <textarea
          value={vastUrl}
          onChange={(e) => setVastUrl(e.target.value)}
          style={{ width: "100%", minHeight: 110, marginTop: 10, padding: 14, borderRadius: 12 }}
        />

        <button onClick={startTest} disabled={!ready} style={{ marginTop: 16 }}>
          {ready ? "▶ Lancer le test VAST" : "Chargement du lecteur…"}
        </button>

        <p className="notice" style={{ marginTop: 18 }}>{status}</p>

        <div style={{
          marginTop: 18,
          padding: 18,
          borderRadius: 14,
          border: `1px solid ${diagnosticColor}`,
          background: "rgba(255,255,255,0.04)"
        }}>
          <strong style={{ color: diagnosticColor }}>🔎 {diagnostic.title}</strong>
          <p className="muted" style={{ marginTop: 8 }}>{diagnostic.detail}</p>
        </div>
      </div>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Lecteur de test</h2>
        <p className="muted">
          Clique sur Lecture. Si une campagne est disponible, la publicité In-stream doit apparaître avant la vidéo.
        </p>

        <video
          id="adpoints-vast-player"
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", maxHeight: 500, background: "#000", borderRadius: 16 }}
        >
          <source src={SAMPLE_VIDEO} type="video/mp4" />
        </video>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>📋 Comment interpréter le test</h2>
        <p className="muted">
          🟢 Une publicité apparaît avant la vidéo = le tag délivre une campagne.<br />
          🟡 La vidéo démarre directement = aucun pré-roll n’a été fourni pour cette requête (No Fill ou disponibilité).<br />
          🔴 Erreur du lecteur = problème de chargement ou de configuration à vérifier.
        </p>
      </section>
    </main>
  );
}
