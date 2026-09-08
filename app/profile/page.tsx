"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { logAudit } from "../lib/audit";
import MessagesNavLink from "../components/MessagesNavLink";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState(0);
  const [changedAt, setChangedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type:"success"|"error";text:string}|null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    setEmail(user.email || "");
    const { data, error } = await supabase
      .from("profiles")
      .select("username,points_balance,username_changed_at,role")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      const name = data.username || "";
      setUsername(name);
      setSavedUsername(name);
      setPoints(data.points_balance ?? 0);
      setChangedAt(data.username_changed_at ?? null);
      // Le Créateur et tous les administrateurs ne sont jamais soumis au délai de 7 jours.
      setIsAdmin(data.role === "admin" || data.role === "creator");
    }
  }

  const cleanUsername = username.trim();
  const changed = cleanUsername !== savedUsername;
  const valid = cleanUsername.length >= 3 && cleanUsername.length <= 24;
  const nextChange = changedAt ? new Date(new Date(changedAt).getTime() + WEEK) : null;
  // Les administrateurs ne sont pas soumis au délai de 7 jours.
  const locked = !isAdmin && !!nextChange && nextChange.getTime() > Date.now();
  const remainingDays = locked && nextChange ? Math.ceil((nextChange.getTime() - Date.now()) / 86400000) : 0;

  async function save() {
    if (!valid) {
      setMessage({type:"error",text:"Le pseudo doit contenir entre 3 et 24 caractères."});
      return;
    }
    if (!changed) {
      setMessage({type:"success",text:"Aucune modification à enregistrer."});
      return;
    }
    if (locked) {
      setMessage({type:"error",text:`Tu pourras modifier ton pseudo dans ${remainingDays} jour(s).`});
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .update({ username: cleanUsername })
        .eq("id", user.id)
        .select("username,username_changed_at")
        .single();

      if (error) throw error;

      setUsername(data.username || cleanUsername);
      setSavedUsername(data.username || cleanUsername);
      setChangedAt(data.username_changed_at || new Date().toISOString());
      await logAudit("profile_username_updated", { username: data.username || cleanUsername }, "/profile");
      setMessage({
        type:"success",
        text: isAdmin
          ? "Pseudo enregistré ! Les administrateurs peuvent le modifier à tout moment."
          : "Pseudo enregistré ! Tu pourras le modifier à nouveau dans 7 jours."
      });
    } catch (error:any) {
      setMessage({type:"error",text:error?.message || "Impossible d’enregistrer le pseudo. Réessaie."});
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await logAudit("logout", {}, "/profile");
    await supabase.auth.signOut();
    router.replace("/");
  }

  const initial = useMemo(
    () => (savedUsername || email || "A").charAt(0).toUpperCase(),
    [savedUsername, email]
  );

  return (
    <main className="dash profileModern">
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/ranking">Classement</Link>
          <Link href="/profile" className="active">Mon profil</Link>
          <MessagesNavLink />
          {isAdmin && <Link href="/admin">Administration</Link>}
          <button onClick={logout}>Déconnexion</button>
        </nav>
      </header>

      <section className="profileModernPage">
        <div className="profileModernCard">
          <div className="profileHero">
            <div>
              <span className="eyebrow modernEyebrow">MON COMPTE</span>
              <h1>Mon <b>profil</b></h1>
              <p>Ton pseudo est celui qui sera affiché sur AdPoints.</p>
            </div>
            <div className="bigAvatar">{initial}</div>
          </div>

          <div className="fieldBlock">
            <label>Pseudo</label>
            <div
              className={"usernameInput " + (valid ? "valid" : "") + (locked ? " locked" : "")}
              onClick={() => {
                if (locked) {
                  setMessage({type:"error",text:`Ton pseudo est bloqué jusqu’à la prochaine modification autorisée dans ${remainingDays} jour(s).`});
                  return;
                }
                usernameInputRef.current?.focus();
              }}
            >
              <input
                ref={usernameInputRef}
                type="text"
                inputMode="text"
                autoComplete="nickname"
                value={username}
                readOnly={locked}
                aria-readonly={locked}
                onChange={e => {
                  if (locked) return;
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g,""));
                  setMessage(null);
                }}
                onFocus={() => {
                  if (locked) setMessage({type:"error",text:`Tu pourras modifier ton pseudo dans ${remainingDays} jour(s).`});
                }}
                placeholder="Ton pseudo"
                maxLength={24}
              />
            </div>

            {locked ? (
              <div className="weeklyLock">
                Modifiable dans <b>{remainingDays} jour(s)</b>
                {nextChange && <small>Prochaine modification : {nextChange.toLocaleDateString("fr-FR")}</small>}
              </div>
            ) : valid ? (
              <div className="available">✓ <b>Pseudo disponible</b></div>
            ) : null}
          </div>

          <button className="saveModern" onClick={save} disabled={saving || !valid || locked}>
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>

          {message && <div className={"profileMessage " + message.type}>{message.text}</div>}

          <div className="profileDivider"/>

          <div className="infoRows">
            <div className="infoModern">
              <div>
                <small>Adresse e-mail</small>
                <strong>{email}</strong>
              </div>
            </div>
            <div className="infoModern">
              <div>
                <small>Solde actuel</small>
                <strong>{points} AdPoints</strong>
              </div>
              <Link href="/dashboard">Voir le tableau de bord</Link>
            </div>
          </div>

          <div className="privacyNote">
            <p>Ton pseudo est visible sur AdPoints. Ton e-mail reste privé.</p>
          </div>
        </div>
      </section>
    </main>
  );
}