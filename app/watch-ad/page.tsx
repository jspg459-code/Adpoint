import Link from "next/link";

export const metadata = {
  title: "Publicités indisponibles | AdPoints",
  robots: {
    index: false,
    follow: false,
  },
};

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
        <h1>Publicités actuellement indisponibles</h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          Cette activité n'est pas encore disponible sur AdPoints. Elle sera réactivée
          uniquement lorsqu'une solution publicitaire compatible avec le fonctionnement
          de la plateforme sera configurée.
        </p>
        <Link href="/dashboard" className="homePrimary" style={{ display: "inline-block", marginTop: 14 }}>
          Retour au tableau de bord
        </Link>
      </section>
    </main>
  );
}
