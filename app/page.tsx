import Link from "next/link";

export default function Home() {
  return (
    <main className="homeModern">
      <header className="modernHeader">
        <Link href="/" className="modernBrand">
          <span className="modernCoin"><i/></span>
          <span><b>Ad</b><strong>Points</strong><small>Regarde. Gagne. Profite.</small></span>
        </Link>
        <nav className="modernNav">
          <Link href="/login" className="navPill"><span className="navIcon">⌂</span><span>Connexion</span></Link>
          <Link href="/signup" className="homePrimary">Créer mon compte</Link>
        </nav>
      </header>

      <section className="homeHero">
        <div className="badge">✦ GAGNE DES RÉCOMPENSES</div>
        <h1>Regarde.<br/><b>Gagne.</b><br/>Profite.</h1>
        <p>Transforme tes activités en AdPoints et échange-les simplement contre des récompenses.</p>
        <div className="homeActions">
          <Link href="/signup" className="homePrimary">Commencer gratuitement →</Link>
          <Link href="/login" className="homeSecondary">J'ai déjà un compte</Link>
        </div>
        <div className="homeStats">
          <div className="homeStat"><strong>✦</strong><span>Réalise des activités</span></div>
          <div className="homeStat"><strong>+</strong><span>Gagne des AdPoints</span></div>
          <div className="homeStat"><strong>✓</strong><span>Échange tes récompenses</span></div>
        </div>
      </section>
    </main>
  );
}
