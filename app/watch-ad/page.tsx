"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logAudit } from "../lib/audit";

const VAST_URL = "https://youradexchange.com/video/select.php?r=1213948";
const SAMPLE_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const FLUID_PLAYER_SRC = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";

export default function WatchAdPage() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Prêt à regarder une publicité.");
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const existing = document.querySelector('script[src="' + FLUID_PLAYER_SRC + '"]') as HTMLScriptElement | null;

    if ((window as any).fluidPlayer) {
      setReady(true);
      return;
    }

    const script = existing || document.createElement("script");
    script.src = FLUID_PLAYER_SRC;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setStatus("Impossible de charger le lecteur vidéo.");

    if (!existing) document.head.appendChild(script);

    return () => {
      if (!existing) script.remove();
    };
  }, []);

  function launchAd() {
    const fluidPlayer = (window as any).fluidPlayer;

    if (!ready || !fluidPlayer) {
      setStatus("Le lecteur est encore en cours de chargement…");
      return;
    }

    const video = document.getElementById("adpoints-watch-player") as HTMLVideoElement | null;
    if (!video) {
      setStatus("Lecteur vidéo introuvable.");
      return;
    }

    setIsPlaying(true);
    setStatus("Préparation de la publicité…");

    try {
      playerRef.current?.destroy?.();
    } catch {}

    video.pause();
    video.currentTime = 0;
    video.load();

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
          adList: [
            {
              roll: "preRoll",
              vastTag: VAST_URL
            }
          ]
        }
      });

      setStatus("Clique maintenant sur ▶ dans le lecteur : la publicité AdCash doit passer avant la vidéo.");
      void logAudit("watch_ad_started", { vast: true }, "/watch-ad");
    } catch (error) {
      setIsPlaying(false);
      setStatus(error instanceof Error ? error.message : "Impossible de lancer la publicité.");
    }
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
          Lance une publicité vidéo. Une vraie vidéo de contenu est chargée derrière le lecteur afin que le pré-roll VAST
          puisse être demandé correctement.
        </p>

        <button
          onClick={launchAd}
          disabled={!ready}
          style={{ marginTop: 24, minWidth: 250 }}
        >
          {!ready ? "Chargement…" : "▶ Regarder une publicité"}
        </button>

        <p className="notice" style={{ marginTop: 18 }}>{status}</p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Lecteur vidéo</h2>
        <p className="muted">Après avoir lancé la session, appuie sur ▶ dans le lecteur pour déclencher le pré-roll.</p>
        <video
          id="adpoints-watch-player"
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", maxHeight: 560, background: "#000", borderRadius: 18 }}
        >
          <source src={SAMPLE_VIDEO} type="video/mp4" />
        </video>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Comment ça fonctionne</h2>
        <p className="muted">
          Le lecteur doit avoir une vraie vidéo de contenu en arrière-plan. Lorsque tu appuies sur Lecture,
          Fluid Player demande d’abord le pré-roll VAST AdCash, puis lance la vidéo de démonstration.
          Aucun AdPoint n’est encore crédité automatiquement.
        </p>
      </section>
    </main>
  );
}
