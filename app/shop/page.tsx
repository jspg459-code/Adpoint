"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { usePointsBalance } from "../components/PointsProvider";
import styles from "./shop.module.css";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  stock: number | null;
  is_active: boolean;
  created_by: string | null;
};

export default function ShopPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Reward[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { points, refreshPoints } = usePointsBalance();

  const isCreator = profile?.role === "creator";

  const loadOffers = useCallback(async () => {
    setLoadingOffers(true);
    const { data, error } = await supabase
      .from("rewards")
      .select("id,title,description,points_cost,stock,is_active,created_by")
      .order("created_at", { ascending: false });

    if (!error) setOffers((data || []) as Reward[]);
    setLoadingOffers(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("username,role")
        .eq("id", user.id)
        .single();

      setProfile(data || null);
      await Promise.all([refreshPoints(), loadOffers()]);
    })();
  }, [router, refreshPoints, loadOffers]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function createOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCreator || !userId || saving) return;

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const pointsCost = Number(form.get("points_cost"));
    const stockRaw = String(form.get("stock") || "").trim();
    const stock = stockRaw === "" ? null : Number(stockRaw);

    if (!title || !Number.isInteger(pointsCost) || pointsCost <= 0 || (stock !== null && (!Number.isInteger(stock) || stock < 0))) {
      setFormError("Vérifie le titre, le coût en AdPoints et le stock.");
      return;
    }

    setSaving(true);
    setFormError("");

    const { error } = await supabase.from("rewards").insert({
      title,
      description: description || null,
      points_cost: pointsCost,
      stock,
      is_active: true,
      created_by: userId,
    });

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    event.currentTarget.reset();
    setShowCreatorForm(false);
    await loadOffers();
  }

  return (
    <main className="dash">
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/ranking">Classement</Link>
          <Link href="/profile">Mon profil</Link>
          {isCreator && <Link href="/admin">Administration</Link>}
          <button onClick={logout}>Déconnexion</button>
        </nav>
      </header>

      <section className="shopPage">
        <div className={styles.shopHeading}>
          <div>
            <span className="eyebrow">BOUTIQUE D’ÉCHANGE</span>
            <h1>Échange tes <b>AdPoints</b></h1>
            <p className="muted shopLead">Parcours les récompenses disponibles et utilise tes points pour obtenir les offres proposées.</p>
          </div>

          {isCreator && (
            <button
              className={styles.createButton}
              onClick={() => {
                setFormError("");
                setShowCreatorForm((value) => !value);
              }}
            >
              {showCreatorForm ? "✕ Fermer" : "+ Créer une offre"}
            </button>
          )}
        </div>

        <div className="shopBalanceCard">
          <span>Ton solde disponible</span>
          <strong>{(points ?? 0).toLocaleString("fr-FR")} AdPoints</strong>
        </div>

        {isCreator && showCreatorForm && (
          <form className={styles.creatorForm} onSubmit={createOffer}>
            <div className={styles.formTitle}>
              <span>✨</span>
              <div>
                <h2>Créer une offre d’échange</h2>
                <p>Cette offre sera visible dans la boutique pour les utilisateurs.</p>
              </div>
            </div>

            <label>
              Nom de l’offre
              <input name="title" placeholder="Ex. Carte cadeau Amazon 10 €" maxLength={120} required />
            </label>

            <label>
              Description
              <textarea name="description" placeholder="Décris précisément ce que l’utilisateur reçoit." maxLength={500} rows={4} />
            </label>

            <div className={styles.formGrid}>
              <label>
                Coût en AdPoints
                <input name="points_cost" type="number" min="1" step="1" placeholder="1000" required />
              </label>
              <label>
                Stock <small>(laisser vide = illimité)</small>
                <input name="stock" type="number" min="0" step="1" placeholder="Illimité" />
              </label>
            </div>

            {formError && <p className={styles.formError}>{formError}</p>}

            <button className={styles.publishButton} type="submit" disabled={saving}>
              {saving ? "Création..." : "Publier l’offre"}
            </button>
          </form>
        )}

        <div className={styles.offersHeader}>
          <div>
            <h2>Offres disponibles</h2>
            <p>Choisis une offre et échange tes AdPoints.</p>
          </div>
          {isCreator && <span className={styles.creatorBadge}>Mode créateur</span>}
        </div>

        {loadingOffers ? (
          <div className={styles.loading}>Chargement des offres...</div>
        ) : offers.length === 0 ? (
          <div className="shopEmpty">
            <div className="shopEmptyIcon">🛍️</div>
            <h2>La boutique est prête</h2>
            <p>{isCreator ? "Crée ta première offre d’échange avec le bouton « Créer une offre »." : "Aucune récompense n’est disponible pour le moment. Les prochaines offres d’échange apparaîtront ici."}</p>
            <Link href="/dashboard" className="shopBrowseButton">← Retour au tableau de bord</Link>
          </div>
        ) : (
          <div className={styles.offersGrid}>
            {offers.map((offer) => (
              <article className={styles.offerCard} key={offer.id}>
                <div className={styles.offerIcon}>🎁</div>
                <h3>{offer.title}</h3>
                {offer.description && <p>{offer.description}</p>}
                <div className={styles.offerFooter}>
                  <strong>{offer.points_cost.toLocaleString("fr-FR")} AdPoints</strong>
                  <span>{offer.stock === null ? "Stock illimité" : offer.stock + " disponible" + (offer.stock > 1 ? "s" : "")}</span>
                </div>
                <button className={styles.exchangeButton} disabled>
                  Échange bientôt
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
