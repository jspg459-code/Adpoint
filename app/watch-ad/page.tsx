"use client";

import Link from "next/link";

export default function WatchAdPage() {
  return (
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
        <h1>Publicités bientôt disponibles</h1>
        <p className="muted">
          Cette fonctionnalité est actuellement indisponible.
        </p>
      </section>
    </main>
  );
}