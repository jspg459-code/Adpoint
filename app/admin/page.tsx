"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  email: string;
  username: string | null;
  points_balance: number;
  is_suspended: boolean;
  ban_until: string | null;
  ban_reason: string | null;
  created_at: string;
};

function remainingTime(date: string) {
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return "Expiré";
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email?.toLowerCase() !== "jspg459@gmail.com") {
      router.replace("/dashboard");
      return;
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (me?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    const [{ data: profiles, error: profilesError }, { data: acts, error: activitiesError }] =
      await Promise.all([
        supabase.from("profiles").select("id,email,username,points_balance,is_suspended,ban_until,ban_reason,created_at").order("created_at", { ascending: false }),
        supabase.from("activities").select("*").order("created_at", { ascending: false })
      ]);

    if (profilesError || activitiesError) {
      setMessage(profilesError?.message || activitiesError?.message || "Erreur de chargement.");
    }

    setUsers(profiles || []);
    setActivities(acts || []);
    setLoading(false);
  }

  async function manageUser(profile: Profile, action: "ban" | "unban" | "delete", durationSeconds?: number, banReason?: string, permanent = false) {
    if (action === "delete" && !window.confirm(`Supprimer définitivement ${profile.email} ? Cette action supprimera aussi son compte Supabase et ses données associées.`)) return;
    if (action === "ban" && !durationSeconds && !permanent) return;

    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        action,
        userId: profile.id,
        durationSeconds,
        reason: action === "ban" ? (banReason || "Bannissement décidé par l’administrateur.") : undefined
      }
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Une erreur est survenue.");
      return;
    }

    if (action === "delete") {
      setUsers(list => list.filter(u => u.id !== profile.id));
      setMessage("Utilisateur supprimé définitivement du site et de Supabase.");
      return;
    }

    if (action === "unban") {
      setUsers(list => list.map(u => u.id === profile.id ? { ...u, is_suspended: false, ban_until: null, ban_reason: null } : u));
      setMessage("Utilisateur débanni avec succès.");
      return;
    }

    const banUntil = data?.ban_until;
    setUsers(list => list.map(u => u.id === profile.id ? { ...u, is_suspended: true, ban_until: banUntil, ban_reason: banReason || "Bannissement décidé par l’administrateur." } : u));
    setMessage("Utilisateur banni avec succès.");
  }


  async function banUser(profile: Profile, durationSeconds?: number, permanent = false) {
    const reason = window.prompt(`Motif du bannissement de ${profile.username || profile.email} :`, "");
    if (reason === null) return;

    const cleanReason = reason.trim();
    if (!cleanReason) {
      setMessage("Tu dois indiquer une raison avant de bannir cet utilisateur.");
      return;
    }

    await manageUser(profile, "ban", durationSeconds, cleanReason, permanent);
  }

  async function submitBan() {
    if (!banDialogUser) return;
    const cleanReason = banReason.trim();
    if (!cleanReason) {
      setMessage("Tu dois indiquer une raison avant de bannir cet utilisateur.");
      return;
    }
    const amount = Number(banDuration);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Indique une durée valide.");
      return;
    }
    const seconds = banUnit === "minutes" ? amount * 60 : banUnit === "hours" ? amount * 3600 : amount * 86400;
    await manageUser(banDialogUser, "ban", Math.round(seconds), cleanReason);
    setBanDialogUser(null);
    setBanReason("");
    setBanDuration("24");
    setBanUnit("hours");
  }

  async function permanentBanFromDialog() {
    if (!banDialogUser) return;
    const cleanReason = banReason.trim();
    if (!cleanReason) {
      setMessage("Tu dois indiquer une raison avant de supprimer définitivement le compte.");
      return;
    }
    if (!window.confirm(`⚠️ Supprimer définitivement le compte de ${banDialogUser.username || banDialogUser.email} ? Cette action est irréversible.`)) return;
    await manageUser(banDialogUser, "delete");
    setBanDialogUser(null);
    setBanReason("");
  }

  async function customBan(profile: Profile) {
    const value = window.prompt("Durée du bannissement en heures :", "24");
    if (!value) return;
    const hours = Number(value.replace(",", "."));
    if (!Number.isFinite(hours) || hours <= 0 || hours > 8760) {
      setMessage("Entre une durée comprise entre 1 heure et 8760 heures.");
      return;
    }
    const reason = window.prompt(`Motif du bannissement de ${profile.username || profile.email} :`, "");
    if (reason === null) return;
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setMessage("Tu dois indiquer une raison avant de bannir cet utilisateur.");
      return;
    }
    await manageUser(profile, "ban", Math.round(hours * 3600), cleanReason);
  }

  async function toggleActivity(activity: any) {
    const { error } = await supabase
      .from("activities")
      .update({ is_active: !activity.is_active })
      .eq("id", activity.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setActivities(list => list.map(a =>
      a.id === activity.id ? { ...a, is_active: !a.is_active } : a
    ));
  }

  const isBanned = (u: Profile) => !!u.ban_until && new Date(u.ban_until).getTime() > Date.now();
  const banned = users.filter(isBanned).length;
  const totalPoints = users.reduce((sum, u) => sum + (u.points_balance || 0), 0);

  if (loading) {
    return <main className="dash adminPage"><p className="muted">Chargement du panel administrateur...</p></main>;
  }

  return (
    <main className="dash adminPage">
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/profile">Mon profil</Link>
          <Link href="/admin" className="active">Administration</Link>
        </nav>
      </header>

      <section className="adminIntro">
        <span className="eyebrow">ESPACE PRIVÉ</span>
        <h1>Panel <b>administrateur</b></h1>
        <p>Gestion complète et sécurisée des comptes AdPoints.</p>
      </section>

      <section className="adminStats">
        <article><small>Utilisateurs</small><strong>{users.length}</strong></article>
        <article><small>Comptes bannis</small><strong>{banned}</strong></article>
        <article><small>AdPoints en circulation</small><strong>{totalPoints}</strong></article>
        <article><small>Activités</small><strong>{activities.length}</strong></article>
      </section>

      {message && <div className="profileMessage error">{message}</div>}

      <section className="adminSection">
        <div className="adminSectionHead">
          <div><h2>Utilisateurs</h2><p>Bannis temporairement, débannis ou supprime définitivement un compte.</p></div>
          <button className="adminRefresh" onClick={load}>Actualiser</button>
        </div>

        <div className="adminList">
          {users.map(user => {
            const activeBan = isBanned(user);
            const busy = busyId === user.id;
            return (
              <article className="adminUser" key={user.id}>
                <div>
                  <strong>{user.username || "Sans pseudo"}</strong>
                  <span>{user.email}</span>
                  {activeBan && <>
                    <span className="muted">⛔ Motif : {user.ban_reason || "Non précisé"}</span>
                    <span className="muted">⏳ {user.ban_until ? `Bannissement restant : ${remainingTime(user.ban_until)}` : "Bannissement définitif"}</span>
                  </>}
                </div>

                <div className="adminUserMeta">
                  <b>{user.points_balance || 0} AdPoints</b>
                  <span className={activeBan ? "status suspended" : "status activeStatus"}>
                    {activeBan ? "Banni" : "Actif"}
                  </span>

                  {activeBan ? (
                    <button disabled={busy} onClick={() => manageUser(user, "unban")}>Débannir</button>
                  ) : (
                    <>
                      <button disabled={busy} onClick={() => banUser(user, 3600)}>Bannir 1h</button>
                      <button disabled={busy} onClick={() => banUser(user, 86400)}>24h</button>
                      <button disabled={busy} onClick={() => banUser(user, 604800)}>7j</button>
                      <button disabled={busy} onClick={() => banUser(user, 2592000)}>30j</button>
                      <button disabled={busy} onClick={() => customBan(user)}>Durée perso</button>
                    </>
                  )}

                  <button disabled={busy} onClick={() => manageUser(user, "delete")} style={{ borderColor: "#ef6b6b" }}>
                    Supprimer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="adminSection">
        <div className="adminSectionHead">
          <div><h2>Activités</h2><p>Active ou désactive les activités disponibles.</p></div>
        </div>

        <div className="adminList">
          {activities.map(activity => (
            <article className="adminUser" key={activity.id}>
              <div>
                <strong>{activity.title}</strong>
                <span>{activity.description || "Aucune description"}</span>
              </div>
              <div className="adminUserMeta">
                <b>+{activity.points_reward} AdPoints</b>
                <span className={activity.is_active ? "status activeStatus" : "status suspended"}>
                  {activity.is_active ? "Active" : "Inactive"}
                </span>
                <button onClick={() => toggleActivity(activity)}>
                  {activity.is_active ? "Désactiver" : "Activer"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {banDialogUser && (
        <div className="adminModalBackdrop" onClick={() => setBanDialogUser(null)}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <h2>🚫 Bannir {banDialogUser.username || banDialogUser.email}</h2>
            <p className="muted">Choisis la durée et indique la raison du bannissement.</p>
            <label>Durée</label>
            <div className="banDurationRow">
              <input type="number" min="1" value={banDuration} onChange={(e) => setBanDuration(e.target.value)} />
              <select value={banUnit} onChange={(e) => setBanUnit(e.target.value as "minutes" | "hours" | "days")}>
                <option value="minutes">Minutes</option>
                <option value="hours">Heures</option>
                <option value="days">Jours</option>
              </select>
            </div>
            <label>Raison du ban</label>
            <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Indique la raison du bannissement..." />
            <div className="adminModalActions">
              <button onClick={() => setBanDialogUser(null)}>Annuler</button>
              <button className="danger" onClick={submitBan}>Bannir</button>
            </div>
            <button className="permanentBanButton" onClick={permanentBanFromDialog}>BAN DÉF — Supprimer définitivement le compte</button>
          </div>
        </div>
      )}

    </main>
  );
}
