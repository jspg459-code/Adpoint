import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <nav>
        <div className="brand"><span className="coin">◉</span>AdPoints</div>
        <div className="navlinks">
          <Link href="/login">Connexion</Link>
          <Link href="/signup" className="smallbtn">Créer mon compte</Link>
        </div>
      </nav>
      <section className="hero">
        <div className="badge">✦ Gagne des récompenses</div>
        <h1>Regarde.<br/><b>Gagne.</b><br/>Profite.</h1>
        <p>Transforme tes activités en AdPoints et échange-les contre des récompenses.</p>
        <Link href="/signup" className="cta">Commencer gratuitement →</Link>
      </section>
    </main>
  );
}
