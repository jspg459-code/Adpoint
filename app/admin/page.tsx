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

  async function manageUser(profile: Profile, action: "ban" | "unban" | "delete", durationSeconds?: number) {
    if (action === "delete" && !window.confirm(`Supprimer définitivement ${profile.email} ? Cette action supprimera aussi son compte Supabase et ses données associées.`)) return;
    if (action === "ban" && !durationSeconds) return;

    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        action,
        userId: profile.id,
        durationSeconds,
        reason: action === "ban" ? "Bannissement décidé par l’administrateur." : undefined
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
    setUsers(list => list.map(u => u.id === profile.id ? { ...u, is_suspended: true, ban_until: banUntil } : u));
    setMessage("Utilisateur banni. Sa session a été déconnectée.");
  }

  async function customBan(profile: Profile) {
    const value = window.prompt("Durée du bannissement en heures :", "24");
    if (!value) return;
    const hours = Number(value.replace(",", "."));
    if (!Number.isFinite(hours) || hours <= 0 || hours > 8760) {
      setMessage("Entre une durée comprise entre 1 heure et 8760 heures.");
      return;
    }
    await manageUser(profile, "ban", Math.round(hours * 3600));
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
                  {activeBan && <span className="muted">⛔ Bannissement restant : {remainingTime(user.ban_until!)}</span>}
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
                      <button disabled={busy} onClick={() => manageUser(user, "ban", 3600)}>Bannir 1h</button>
                      <button disabled={busy} onClick={() => manageUser(user, "ban", 86400)}>24h</button>
                      <button disabled={busy} onClick={() => manageUser(user, "ban", 604800)}>7j</button>
                      <button disabled={busy} onClick={() => manageUser(user, "ban", 2592000)}>30j</button>
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
    </main>
  );
}
