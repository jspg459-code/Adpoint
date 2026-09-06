"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  useEffect(()=>{
    const hash=window.location.hash;
    const search=window.location.search;
    const isRecovery=hash.includes("type=recovery") || search.includes("type=recovery") || search.includes("code=");

    if(isRecovery){
      window.location.replace("/reset-password"+search+hash);
    }
  },[]);

  return (
    <main className="homeModern">
      <header className="modernHeader">
        <Link href="/" className="modernBrand" aria-label="AdPoints">
          <span className="modernCoin"><i/></span>
          <span><b>Ad</b><strong>Points</strong></span>
        </Link>
        <nav className="modernNav">
          <Link href="/login" className="navPill"><span>Connexion</span></Link>
          <Link href="/signup" className="homePrimary">Créer mon compte</Link>
        </nav>
      </header>

      <section className="homeHero">
        <div className="badge">✦ GAGNE DES RÉCOMPENSES</div>
        <h1>Regarde.<br/><b>Gagne.</b><br/>Profite.</h1>
        <p>Transforme tes activités en AdPoints et échange-les contre des récompenses.</p>
        <div className="homeActions">
          <Link href="/signup" className="homePrimary">Commencer gratuitement →</Link>
          <Link href="/login" className="homeSecondary">Se connecter</Link>
        </div>
      </section>
    </main>
  );
}