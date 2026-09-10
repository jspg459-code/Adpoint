"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logAudit } from "../lib/audit";

const VAST_URL = "https://youradexchange.com/video/select.php?r=1213948";
const TECHNICAL_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const FLUID_PLAYER_SRC = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";

export default function WatchAdPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Prêt à regarder une publicité.");
  const playerRef = useRef<any>(null);
  const finishingRef = useRef(false);

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

  function finishAd(message: string) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setStatus(message);

    window.setTimeout(() => {
      router.push("/dashboard");
    }, 1800);
  }

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

    finishingRef.current = false;
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
          allowTheatre: false,
          miniPlayer: { enabled: false }
        },
        vastOptions: {
          adList: [
            {
              roll: "preRoll",
              vastTag: VAST_URL
            }
          ],
          vastVideoStartedCallback: () => {
            setStatus("Publicité en cours…");
            void logAudit("watch_ad_vast_started", { vast: true }, "/watch-ad");
          },
          vastVideoEndedCallback: () => {
            void logAudit("watch_ad_vast_completed", { vast: true }, "/watch-ad");
            finishAd("Publicité terminée. Retour au tableau de bord…");
          },
          vastVideoSkippedCallback: () => {
            void logAudit("watch_ad_vast_skipped", { vast: true }, "/watch-ad");
            finishAd("Publicité passée. Retour au tableau de bord…");
          },
          noVastVideoCallback: () => {
            setStatus("Aucune publicité disponible pour le moment. Réessaie plus tard.");
          }
        }
      });

      setStatus("Appuie sur ▶ pour lancer la publicité.");
      void logAudit("watch_ad_started", { vast: true }, "/watch-ad");
    } catch (error) {
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
          Lance une publicité et regarde-la directement dans le lecteur AdPoints.
        </p>

        <button onClick={launchAd} disabled={!ready} style={{ marginTop: 24, minWidth: 250 }}>
          {!ready ? "Chargement…" : "▶ Regarder une publicité"}
        </button>

        <p className="notice" style={{ marginTop: 18 }}>{status}</p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Publicité</h2>
          <span className="eyebrow">ADPOINTS</span>
        </div>

        <video
          id="adpoints-watch-player"
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", maxHeight: 560, background: "#000", borderRadius: 18 }}
        >
          <source src={TECHNICAL_VIDEO} type="video/mp4" />
        </video>

        <p className="muted" style={{ marginTop: 14 }}>
          La vidéo technique sert uniquement au fonctionnement du format In-stream et n’est pas présentée comme du contenu AdPoints.
        </p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Une seule expérience</h2>
        <p className="muted">
          Après la publicité, tu es automatiquement renvoyé vers ton tableau de bord.
          La vidéo de démonstration ne doit plus être regardée comme une étape supplémentaire.
        </p>
      </section>
    </main>
  );
}
