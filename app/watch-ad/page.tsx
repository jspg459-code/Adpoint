"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const VAST_URL = "https://youradexchange.com/video/select.php?r=12139498";
const CONTENT_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";

export default function WatchAdPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState("Chargement du lecteur publicitaire…");
  const playerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!sdkReady || initializedRef.current) return;

    const videojs = (window as any).videojs;
    if (!videojs) return;

    initializedRef.current = true;
    const player = videojs("adpoints-ad-player", {
      controls: true,
      preload: "auto",
      playsinline: true,
      fluid: true,
    });

    playerRef.current = player;

    try {
      player.ima({
        adTagUrl: VAST_URL,
        debug: true,
      });

      player.on("ads-ad-started", () => setStatus("Publicité en cours…"));
      player.on("ads-ad-ended", () => setStatus("Publicité terminée."));
      player.on("adserror", () =>
        setStatus("Impossible de charger une publicité pour le moment.")
      );
      player.on("error", () =>
        setStatus("Erreur du lecteur. Vérification du tag publicitaire nécessaire.")
      );

      setStatus("Lecteur prêt. Appuie sur ▶ pour lancer la publicité.");
    } catch {
      setStatus("Le plugin publicitaire n’a pas pu être initialisé.");
    }

    return () => {
      try {
        player.dispose();
      } catch {}
      playerRef.current = null;
      initializedRef.current = false;
    };
  }, [sdkReady]);

  function startAd() {
    const player = playerRef.current;
    if (!player) {
      setStatus("Le lecteur est encore en cours de chargement…");
      return;
    }

    setStatus("Recherche d’une publicité…");

    try {
      /*
       * videojs-ima déclenche la demande VAST à partir d'un geste utilisateur.
       */
      player.ima?.initializeAdDisplayContainer?.();
      player.ima?.requestAds?.();
      player.play?.();
    } catch {
      setStatus("Impossible de demander la publicité.");
    }
  }

  return (
    <>
      <Script
        src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://vjs.zencdn.net/8.21.0/video.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/videojs-contrib-ads@7/dist/videojs-contrib-ads.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/videojs-ima@2/dist/videojs.ima.min.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <link
        href="https://vjs.zencdn.net/8.21.0/video-js.css"
        rel="stylesheet"
      />

      <main className="dash" style={{ maxWidth: 960, margin: "0 auto", padding: "28px 18px 90px" }}>
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
          <span className="eyebrow">PUBLICITÉ VIDÉO</span>
          <h1>🎬 Regarder une publicité</h1>
          <p className="muted" style={{ maxWidth: 680, margin: "12px auto 0" }}>
            Le lecteur utilise l’intégration VAST/IMA recommandée pour les zones In-stream Video.
          </p>

          <button
            onClick={startAd}
            disabled={!sdkReady}
            style={{ marginTop: 24, minWidth: 250 }}
          >
            {!sdkReady ? "Chargement…" : "▶ Lancer la publicité"}
          </button>

          <p className="notice" style={{ marginTop: 18 }}>{status}</p>
        </section>

        <section className="profileBox" style={{ marginTop: 24 }}>
          <video
            id="adpoints-ad-player"
            className="video-js vjs-big-play-centered"
            controls
            playsInline
            preload="auto"
            style={{ width: "100%", borderRadius: 18 }}
          >
            <source src={CONTENT_VIDEO} type="video/mp4" />
          </video>

          <p className="muted" style={{ marginTop: 14 }}>
            Zone AdCash In-stream Video : <strong>12139498</strong>
          </p>
        </section>
      </main>
    </>
  );
}