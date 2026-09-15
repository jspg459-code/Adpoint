"use client";

import Link from "next/link";
import { useEffect } from "react";

const sectionStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "72px 22px",
};

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  padding: 24,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function Home() {
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const isRecovery =
      hash.includes("type=recovery") ||
      search.includes("type=recovery") ||
      search.includes("code=");

    if (isRecovery) {
      window.location.replace("/reset-password" + search + hash);
    }
  }, []);

  return (
    <main className="homeModern">
      <header className="modernHeader">
        <Link href="/" className="modernBrand" aria-label="AdPoints">
          <span className="modernCoin"><i /></span>
          <span><b>Ad</b><strong>Points</strong></span>
        </Link>
        <nav className="modernNav">
          <Link href="#fonctionnement" className="navPill">Comment ça marche</Link>
          <Link href="#faq" className="navPill">FAQ</Link>
          <Link href="/login" className="navPill"><span>Connexion</span></Link>
        </nav>
      </header>

      <section className="homeHero">
        <div className="badge">✦ PLATEFORME DE RÉCOMPENSES</div>
        <h1>Regarde.<br/><b>Gagne.</b><br/>Profite.</h1>
        <p>
          AdPoints transforme certaines activités disponibles sur la plateforme en
          points que tu peux utiliser selon les récompenses proposées dans le service.
        </p>
        <div className="homeActions">
          <Link href="/signup" className="homePrimary">Commencer gratuitement →</Link>
          <Link href="/login" className="homeSecondary">Se connecter</Link>
        </div>
      </section>

      <section id="fonctionnement" style={sectionStyle}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div className="badge">COMMENT ÇA MARCHE</div>
          <h2 style={{ fontSize: "clamp(30px, 5vw, 46px)", margin: "14px 0 10px" }}>
            Une expérience simple et transparente
          </h2>
          <p className="muted" style={{ maxWidth: 720, margin: "0 auto", lineHeight: 1.7 }}>
            Crée ton compte, découvre les activités disponibles, consulte ton solde
            et utilise tes points lorsque les récompenses correspondantes sont ouvertes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          <article style={cardStyle}>
            <div style={{ fontSize: 30 }}>①</div>
            <h3>Créer un compte</h3>
            <p className="muted">Inscris-toi gratuitement et retrouve ton espace personnel.</p>
          </article>
          <article style={cardStyle}>
            <div style={{ fontSize: 30 }}>②</div>
            <h3>Participer</h3>
            <p className="muted">Consulte les activités réellement disponibles sur AdPoints.</p>
          </article>
          <article style={cardStyle}>
            <div style={{ fontSize: 30 }}>③</div>
            <h3>Accumuler</h3>
            <p className="muted">Les points obtenus sont visibles dans ton tableau de bord.</p>
          </article>
          <article style={cardStyle}>
            <div style={{ fontSize: 30 }}>④</div>
            <h3>Utiliser</h3>
            <p className="muted">Lorsque la boutique est ouverte, échange tes points contre les récompenses proposées.</p>
          </article>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          <article style={cardStyle}>
            <h2>Ton espace personnel</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Suis ton solde, ton classement et les fonctionnalités disponibles depuis
              ton tableau de bord. Les informations liées à ton compte restent accessibles
              après connexion.
            </p>
            <Link href="/signup" className="homePrimary" style={{ display: "inline-block", marginTop: 10 }}>
              Créer mon compte
            </Link>
          </article>
          <article style={cardStyle}>
            <h2>Une plateforme en évolution</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              AdPoints est actuellement en phase de développement. Certaines activités
              et certaines récompenses peuvent donc être temporairement indisponibles.
            </p>
          </article>
        </div>
      </section>

      <section id="faq" style={{ ...sectionStyle, paddingTop: 45 }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div className="badge">FAQ</div>
          <h2 style={{ fontSize: "clamp(30px, 5vw, 46px)", margin: "14px 0 10px" }}>
            Questions fréquentes
          </h2>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <details style={cardStyle}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Qu'est-ce qu'un AdPoint ?</summary>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Un AdPoint est une unité de récompense utilisée dans ton compte AdPoints.
              Les modalités d'obtention et d'utilisation sont précisées pour chaque fonctionnalité.
            </p>
          </details>
          <details style={cardStyle}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Les publicités sont-elles toujours disponibles ?</summary>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Non. La disponibilité dépend des campagnes et des fonctionnalités activées sur la plateforme.
              Une activité peut être temporairement indisponible.
            </p>
          </details>
          <details style={cardStyle}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Où puis-je suivre mes points ?</summary>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Après connexion, ton solde et les principales fonctionnalités sont accessibles depuis ton tableau de bord.
            </p>
          </details>
          <details style={cardStyle}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Pourquoi certaines fonctionnalités peuvent-elles être indisponibles ?</summary>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              AdPoints est encore en évolution. Nous préférons afficher clairement une fonctionnalité indisponible
              plutôt que de présenter un service qui ne fonctionne pas encore.
            </p>
          </details>
        </div>
      </section>

      <footer style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 70px", textAlign: "center" }}>
        <p className="muted">AdPoints · Regarde. Gagne. Profite.</p>
        <p className="muted" style={{ fontSize: 13 }}>
          Les récompenses et fonctionnalités disponibles peuvent évoluer pendant la phase bêta.
        </p>
      </footer>
    </main>
  );
}
