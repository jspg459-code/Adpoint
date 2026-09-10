"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logAudit } from "../lib/audit";

const VAST_URL = "https://youradexchange.com/video/select.php?r=1213948";
const FLUID_PLAYER_SRC = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";

export default function WatchAdPage() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Prêt à regarder une publicité.");
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = FLUID_PLAYER_SRC;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setStatus("Impossible de charger le lecteur vidéo.");
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  function launchAd() {
    const fluidPlayer = (window as any).fluidPlayer;

    if (!ready || !fluidPlayer) {
      setStatus("Le lecteur est encore en cours de chargement…");
      return;
    }

    if (isPlaying) return;

    setIsPlaying(true);
    setStatus("Publicité en cours de chargement…");

    try {
      playerRef.current?.destroy?.();
    } catch {}

    const video = document.getElementById("adpoints-watch-player") as HTMLVideoElement | null;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.load();
    }

    setTimeout(() => {
      try {
        playerRef.current = fluidPlayer("adpoints-watch-player", {
          layoutControls: {
            primaryColor: "#35c979",
            autoPlay: false,
            mute: false,
            allowDownload: false,
            playbackRateEnabled: false,
            allowTheatre: true,
            miniPlayer: { enabled: false }
          },
          vastOptions: {
            adList: [{ roll: "preRoll", vastTag: VAST_URL }]
          }
        });
        setStatus("Clique sur Lecture pour démarrer la publicité.");
        void logAudit("watch_ad_started", {}, "/watch-ad");
      } catch (error) {
        setIsPlaying(false);
        setStatus(error instanceof Error ? error.message : "Impossible de lancer la publicité.");
      }
    }, 50);
  }

  return (
    <main className="dash" style={{ maxWidth: 960, margin: "0 auto", padding: "28px 18px 90px" }}>
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/ranking">Classement</Link>
          <Link href="/profile">Mon profil</Link>
        </nav>
      </header>

      <section className="profileBox" style={{ marginTop: 28, textAlign: "center" }}>
        <span className="eyebrow">GAGNE DES ADPOINTS</span>
        <h1>🎬 Regarde une publicité</h1>
        <p className="muted" style={{ maxWidth: 680, margin: "12px auto 0", lineHeight: 1.6 }}>
          Regarde la publicité jusqu’à la fin. Cette première version sert à valider la diffusion vidéo AdCash.
          Les récompenses sont volontairement désactivées tant que le système de validation n’est pas finalisé.
        </p>

        <button
          onClick={launchAd}
          disabled={!ready || isPlaying}
          style={{ marginTop: 24, minWidth: 250 }}
        >
          {!ready ? "Chargement…" : isPlaying ? "Publicité en cours…" : "▶ Regarder une publicité"}
        </button>

        <p className="notice" style={{ marginTop: 18 }}>{status}</p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Lecteur vidéo</h2>
        <video
          id="adpoints-watch-player"
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", maxHeight: 560, background: "#000", borderRadius: 18 }}
        />
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Comment ça fonctionne</h2>
        <p className="muted">
          Une publicité In-stream AdCash est demandée quand tu lances le visionnage. Pour le moment,
          aucun AdPoint n’est crédité automatiquement : nous devons d’abord valider le mécanisme de fin de pub
          et les conditions de récompense du fournisseur.
        </p>
      </section>
    </main>
  );
}
