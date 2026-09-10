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
  const adStartedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

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
    script.onerror = () => setStatus("Impossible de charger le lecteur publicitaire.");

    if (!existing) document.head.appendChild(script);

    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      if (!existing) script.remove();
    };
  }, []);

  function clearFallback() {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }

  function finishAd(message: string) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    clearFallback();
    setStatus(message);

    window.setTimeout(() => {
      router.push("/dashboard");
    }, 1800);
  }

  function stopTechnicalVideo(message: string) {
    const video = document.getElementById("adpoints-watch-player") as HTMLVideoElement | null;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setStatus(message);
  }

  function launchAd() {
    const fluidPlayer = (window as any).fluidPlayer;

    if (!ready || !fluidPlayer) {
      setStatus("Le lecteur publicitaire est encore en cours de chargement…");
      return;
    }

    const video = document.getElementById("adpoints-watch-player") as HTMLVideoElement | null;
    if (!video) {
      setStatus("Lecteur publicitaire introuvable.");
      return;
    }

    finishingRef.current = false;
    adStartedRef.current = false;
    clearFallback();
    setStatus("Chargement de la publicité…");

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
            adStartedRef.current = true;
            clearFallback();
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
            clearFallback();
            stopTechnicalVideo("Aucune publicité disponible pour le moment. Réessaie plus tard.");
          }
        }
      });

      /*
       * Important sur mobile : on démarre le lecteur directement depuis le clic
       * sur le bouton. Le pré-roll VAST est ainsi déclenché dans le geste utilisateur
       * au lieu de laisser l'utilisateur lancer uniquement la vidéo technique.
       */
      const playResult = playerRef.current?.play?.();
      if (playResult?.catch) {
        playResult.catch(() => {
          setStatus("Appuie à nouveau sur le bouton pour autoriser la lecture.");
        });
      }

      /*
       * Sécurité : si aucun événement VAST ne démarre, on bloque la vidéo technique.
       * Elle ne doit jamais être regardée seule comme une publicité AdPoints.
       */
      fallbackTimerRef.current = window.setTimeout(() => {
        if (!adStartedRef.current && !finishingRef.current) {
          stopTechnicalVideo("La publicité n’a pas démarré. Aucune récompense n’a été attribuée.");
          void logAudit("watch_ad_no_vast_fill", { vast: true }, "/watch-ad");
        }
      }, 6000);

      void logAudit("watch_ad_started", { vast: true }, "/watch-ad");
    } catch (error) {
      stopTechnicalVideo(error instanceof Error ? error.message : "Impossible de lancer la publicité.");
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
          Le lecteur technique est utilisé uniquement pour permettre l’affichage du pré-roll publicitaire.
          S’il n’y a pas de publicité disponible, la vidéo technique est automatiquement arrêtée.
        </p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Une seule expérience</h2>
        <p className="muted">
          Une récompense ne pourra être attribuée que par le système AdPoints après validation complète
          de l’expérience publicitaire.
        </p>
      </section>
    </main>
  );
}
