"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fluidPlayer?: (id: string, options?: any) => any;
  }
}

const SAMPLE_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";

type Diagnostic = {
  state: "idle" | "loading" | "success" | "warning" | "error";
  title: string;
  detail: string;
};

export default function VideoTestPage() {
  const [vastUrl, setVastUrl] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Colle ton URL VAST AdCash puis lance le test.");
  const [diagnostic, setDiagnostic] = useState<Diagnostic>({
    state: "idle",
    title: "Diagnostic en attente",
    detail: "Lance le test pour analyser le comportement du tag VAST."
  });
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
    script.onerror = () => {
      setReady(false);
      setStatus("Impossible de charger le lecteur vidéo.");
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

    if (!url.startsWith("http")) {
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

    try {
      playerRef.current?.destroy?.();
    } catch {}

    setStatus("Analyse du tag VAST puis lancement du lecteur…");
    setDiagnostic({
      state: "loading",
      title: "Analyse en cours",
      detail: "Nous attendons la réponse du lecteur publicitaire."
    });

    const video = document.getElementById("adpoints-vast-player") as HTMLVideoElement | null;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.load();
    }

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
            ],
            onVastAdStarted: () => {
              setStatus("🟢 Publicité détectée : lecture en cours.");
              setDiagnostic({
                state: "success",
                title: "Publicité VAST détectée",
                detail: "AdCash a fourni une publicité et elle est en cours de lecture."
              });
            },
            onVastAdEnded: () => {
              setStatus("🟢 Publicité terminée.");
              setDiagnostic({
                state: "success",
                title: "Publicité terminée",
                detail: "La publicité s’est terminée normalement."
              });
            },
            onVastAdSkipped: () => {
              setStatus("🟡 Publicité passée par l’utilisateur.");
              setDiagnostic({
                state: "warning",
                title: "Publicité skippée",
                detail: "Une publicité a été détectée mais elle n’a pas été regardée jusqu’à la fin."
              });
            },
            onVastAdError: (error: any) => {
              setStatus("🔴 Erreur VAST : aucune publicité n’a pu être lancée.");
              setDiagnostic({
                state: "error",
                title: "Erreur VAST / No Fill possible",
                detail: error?.message || "Le tag n’a pas fourni de publicité lisible au lecteur. Cela peut être un No Fill, une zone inactive ou une erreur de configuration."
              });
            },
            onVastNoAd: () => {
              setStatus("🟡 Aucune publicité disponible pour ce test.");
              setDiagnostic({
                state: "warning",
                title: "Aucune publicité disponible",
                detail: "Le lecteur fonctionne, mais aucune publicité n’a été fournie pour cette requête (No Fill possible)."
              });
            }
          }
        });

        setStatus("Test lancé : clique sur Lecture. Le diagnostic se mettra à jour automatiquement.");
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
          Cette page vérifie si le tag VAST AdCash fournit réellement une publicité.
          Aucun AdPoint n’est distribué pendant ce test.
        </p>

        <label style={{ display: "block", marginTop: 24, fontWeight: 700 }}>
          URL VAST AdCash complète
        </label>

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
          Une vraie publicité doit apparaître avant la vidéo de démonstration.
          Si la vidéo de démonstration démarre directement, regarde le diagnostic ci-dessus.
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
        <h2>📋 Résultat attendu</h2>
        <p className="muted">
          🟢 Publicité détectée = le tag fonctionne.<br />
          🟡 Aucune publicité disponible = probablement No Fill ou zone sans campagne disponible.<br />
          🔴 Erreur VAST = URL, zone ou réponse publicitaire à vérifier.
        </p>
      </section>
    </main>
  );
}
