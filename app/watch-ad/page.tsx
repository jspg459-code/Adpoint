"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const VAST_URL = "https://youradexchange.com/video/select.php?r=12139498";

export default function WatchAdPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState("Chargement du système publicitaire…");
  const [errorDetails, setErrorDetails] = useState("");
  const playerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!sdkReady || initializedRef.current) return;

    const videojs = (window as any).videojs;
    if (!videojs) {
      setStatus("Video.js n’a pas été chargé.");
      return;
    }

    initializedRef.current = true;

    const player = videojs("adpoints-ad-player", {
      controls: false,
      autoplay: false,
      preload: "none",
      playsinline: true,
      fluid: true,
    });

    playerRef.current = player;

    try {
      player.ima({
        adTagUrl: VAST_URL,
        debug: true,
      });

      player.on("ads-ad-started", () => {
        setErrorDetails("");
        setStatus("✅ Publicité AdCash en cours de lecture…");
      });

      player.on("ads-ad-ended", () => {
        setStatus("✅ Publicité terminée.");
      });

      player.on("adserror", (_event: unknown, data: any) => {
        const message =
          data?.error?.getMessage?.() ||
          data?.error?.message ||
          JSON.stringify(data?.error || data || {});
        setStatus("❌ Erreur lors du chargement de la publicité.");
        setErrorDetails(String(message));
      });

      setStatus("Prêt. Appuie sur le bouton pour demander une publicité AdCash.");
    } catch (error) {
      setStatus("❌ Impossible d’initialiser Google IMA.");
      setErrorDetails(error instanceof Error ? error.message : String(error));
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

    setStatus("🔄 Demande envoyée à AdCash…");
    setErrorDetails("");

    try {
      player.ima?.initializeAdDisplayContainer?.();
      player.ima?.requestAds?.();
    } catch (error) {
      setStatus("❌ Impossible d’envoyer la demande publicitaire.");
      setErrorDetails(error instanceof Error ? error.message : String(error));
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
      <link href="https://vjs.zencdn.net/8.21.0/video-js.css" rel="stylesheet" />

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
          <span className="eyebrow">TEST ADCASH VAST</span>
          <h1>🎬 Test de publicité</h1>
          <p className="muted" style={{ maxWidth: 680, margin: "12px auto 0" }}>
            Ce test ne contient volontairement aucune vidéo de démonstration.
            Seule une publicité réellement renvoyée par AdCash pourra apparaître.
          </p>

          <button
            onClick={startAd}
            disabled={!sdkReady}
            style={{ marginTop: 24, minWidth: 270 }}
          >
            {!sdkReady ? "Chargement…" : "▶ Tester la publicité AdCash"}
          </button>

          <p className="notice" style={{ marginTop: 18 }}>{status}</p>

          {errorDetails && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 12,
                textAlign: "left",
                wordBreak: "break-word",
                background: "rgba(255,255,255,0.06)"
              }}
            >
              <strong>Diagnostic technique :</strong>
              <br />
              {errorDetails}
            </div>
          )}
        </section>

        <section className="profileBox" style={{ marginTop: 24 }}>
          <div
            id="ad-container"
            style={{
              width: "100%",
              minHeight: 260,
              borderRadius: 18,
              background: "#000",
              overflow: "hidden"
            }}
          >
            <video
              id="adpoints-ad-player"
              className="video-js"
              playsInline
              preload="none"
              style={{ width: "100%", minHeight: 260 }}
            />
          </div>

          <p className="muted" style={{ marginTop: 14 }}>
            Zone AdCash In-stream Video : <strong>12139498</strong>. Aucune vidéo de démonstration n’est configurée.
          </p>
        </section>
      </main>
    </>
  );
}