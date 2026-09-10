"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logAudit } from "../lib/audit";

const VAST_URL = "https://youradexchange.com/video/select.php?r=12139498";
const TECHNICAL_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const FLUID_PLAYER_SRC = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
const FLUID_PLAYER_CSS = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css";

export default function WatchAdPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [status, setStatus] = useState("Prêt à regarder une publicité.");
  const playerRef = useRef<any>(null);
  const finishingRef = useRef(false);
  const adStartedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

  function clearFallback() {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }

  function stopTechnicalVideo(message: string) {
    const video = document.getElementById("adpoints-watch-player") as HTMLVideoElement | null;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setStatus(message);
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

  useEffect(() => {
    let css = document.querySelector(
      'link[href="' + FLUID_PLAYER_CSS + '"]'
    ) as HTMLLinkElement | null;

    if (!css) {
      css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = FLUID_PLAYER_CSS;
      document.head.appendChild(css);
    }

    if ((window as any).fluidPlayer) {
      setReady(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="' + FLUID_PLAYER_SRC + '"]'
    ) as HTMLScriptElement | null;

    const script = existing || document.createElement("script");
    script.src = FLUID_PLAYER_SRC;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () =>
      setStatus("Impossible de charger le lecteur publicitaire.");

    if (!existing) document.head.appendChild(script);

    return () => {
      clearFallback();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const fluidPlayer = (window as any).fluidPlayer;
    const video = document.getElementById(
      "adpoints-watch-player"
    ) as HTMLVideoElement | null;

    if (!fluidPlayer || !video) return;

    try {
      playerRef.current?.destroy?.();
    } catch {}

    finishingRef.current = false;
    adStartedRef.current = false;

    playerRef.current = fluidPlayer("adpoints-watch-player", {
      debug: true,
      layoutControls: {
        primaryColor: "#35c979",
        autoPlay: false,
        mute: false,
        playButtonShowing: true,
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
        vastTimeout: 15000,
        maxAllowedVastTagRedirects: 5,
        vastAdvanced: {
          vastLoadedCallback: () => {
            setStatus("Publicité AdCash chargée. Lecture en cours…");
          },
          vastVideoSkippedCallback: () => {
            clearFallback();
            void logAudit("watch_ad_vast_skipped", { vast: true }, "/watch-ad");
            finishAd("Publicité passée. Aucune récompense automatique.");
          },
          vastVideoEndedCallback: () => {
            clearFallback();
            void logAudit("watch_ad_vast_completed", { vast: true }, "/watch-ad");
            finishAd("Publicité terminée. Validation de l’expérience…");
          },
          noVastVideoCallback: () => {
            clearFallback();
            stopTechnicalVideo(
              "Aucune publicité AdCash disponible pour le moment. Aucune récompense n’a été attribuée."
            );
            void logAudit("watch_ad_no_vast_fill", { vast: true }, "/watch-ad");
          }
        }
      }
    });

    playerRef.current?.on?.("playing", (_event: Event, info: any) => {
      if (info?.mediaSourceType === "preRoll" && !adStartedRef.current) {
        adStartedRef.current = true;
        clearFallback();
        setStatus("Publicité AdCash en cours…");
        void logAudit("watch_ad_vast_started", { vast: true }, "/watch-ad");
      }
    });

    setPlayerReady(true);

    return () => {
      clearFallback();
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [ready]);

  function launchAd() {
    if (!playerReady || !playerRef.current) {
      setStatus("Le lecteur publicitaire est encore en cours de préparation…");
      return;
    }

    finishingRef.current = false;
    adStartedRef.current = false;
    clearFallback();
    setStatus("Connexion à AdCash et recherche d’une publicité…");

    try {
      /*
       * La lecture est déclenchée directement depuis le clic utilisateur,
       * indispensable sur Safari/iPhone pour permettre le pré-roll.
       */
      playerRef.current.play();

      fallbackTimerRef.current = window.setTimeout(() => {
        if (!adStartedRef.current && !finishingRef.current) {
          stopTechnicalVideo(
            "La publicité n’a pas démarré après le délai d’attente. Aucune récompense n’a été attribuée."
          );
          void logAudit("watch_ad_vast_timeout", { vast: true }, "/watch-ad");
        }
      }, 20000);

      void logAudit("watch_ad_started", { vast: true }, "/watch-ad");
    } catch (error) {
      stopTechnicalVideo(
        error instanceof Error ? error.message : "Impossible de lancer la publicité."
      );
    }
  }

  return (
    <main
      className="dash"
      style={{ maxWidth: 960, margin: "0 auto", padding: "28px 18px 90px" }}
    >
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">
          Ad<span>Points</span>
        </Link>
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

        <button
          onClick={launchAd}
          disabled={!ready || !playerReady}
          style={{ marginTop: 24, minWidth: 250 }}
        >
          {!ready || !playerReady ? "Chargement…" : "▶ Regarder une publicité"}
        </button>

        <p className="notice" style={{ marginTop: 18 }}>{status}</p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12
          }}
        >
          <h2 style={{ margin: 0 }}>Publicité</h2>
          <span className="eyebrow">ADPOINTS</span>
        </div>

        <video
          id="adpoints-watch-player"
          controls
          playsInline
          preload="metadata"
          style={{
            width: "100%",
            maxHeight: 560,
            background: "#000",
            borderRadius: 18
          }}
        >
          <source src={TECHNICAL_VIDEO} type="video/mp4" />
        </video>

        <p className="muted" style={{ marginTop: 14 }}>
          La vidéo technique sert uniquement de support au format In-stream. Si AdCash ne fournit
          aucune publicité, elle est arrêtée automatiquement et aucune récompense n’est attribuée.
        </p>
      </section>

      <section className="profileBox" style={{ marginTop: 24 }}>
        <h2>Une seule expérience</h2>
        <p className="muted">
          Une récompense ne pourra être attribuée que par le système AdPoints après validation
          complète de l’expérience publicitaire.
        </p>
      </section>
    </main>
  );
}
