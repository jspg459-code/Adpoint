"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { logAudit } from "../lib/audit";

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

type BanChoice = "1h" | "24h" | "7d" | "30d" | "custom" | "permanent";

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

  const [banDialogUser, setBanDialogUser] = useState<Profile | null>(null);
  const [banChoice, setBanChoice] = useState<BanChoice>("24h");
  const [banDuration, setBanDuration] = useState("24");
  const [banUnit, setBanUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [banReason, setBanReason] = useState("");

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
        supabase
          .from("profiles")
          .select("id,email,username,points_balance,is_suspended,ban_until,ban_reason,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("activities").select("*").order("created_at", { ascending: false })
      ]);

    if (profilesError || activitiesError) {
      setMessage(profilesError?.message || activitiesError?.message || "Erreur de chargement.");
    }

    setUsers(profiles || []);
    setActivities(acts || []);
    setLoading(false);
  }

  async function manageUser(
    profile: Profile,
    action: "ban" | "unban" | "delete",
    durationSeconds?: number,
    reason?: string
  ) {
    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        action,
        userId: profile.id,
        durationSeconds,
        reason: action === "ban" ? (reason || "Bannissement décidé par l’administrateur.") : undefined
      }
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Une erreur est survenue.");
      return false;
    }

    if (action === "delete") {
      await logAudit("admin_delete_user", { target_user_id: profile.id, target: profile.username || profile.email }, "/admin");
      setUsers(list => list.filter(u => u.id !== profile.id));
      setMessage("Compte supprimé définitivement du site et de Supabase.");
      return true;
    }

    if (action === "unban") {
      await logAudit("admin_unban_user", { target_user_id: profile.id, target: profile.username || profile.email }, "/admin");
      setUsers(list =>
        list.map(u =>
          u.id === profile.id
            ? { ...u, is_suspended: false, ban_until: null, ban_reason: null }
            : u
        )
      );
      setMessage("Utilisateur débanni avec succès.");
      return true;
    }

    const banUntil = data?.ban_until;
    await logAudit("admin_ban_user", {
      target_user_id: profile.id,
      target: profile.username || profile.email,
      duration_seconds: durationSeconds || null,
      reason: reason || null
    }, "/admin");
    setUsers(list =>
      list.map(u =>
        u.id === profile.id
          ? {
              ...u,
              is_suspended: true,
              ban_until: banUntil,
              ban_reason: reason || "Bannissement décidé par l’administrateur."
            }
          : u
      )
    );
    setMessage("Utilisateur banni avec succès.");
    return true;
  }

  function openBanDialog(profile: Profile) {
    setBanDialogUser(profile);
    setBanChoice("24h");
    setBanDuration("24");
    setBanUnit("hours");
    setBanReason("");
    setMessage("");
  }

  function closeBanDialog() {
    setBanDialogUser(null);
    setBanReason("");
  }

  function getDurationSeconds() {
    if (banChoice === "1h") return 3600;
    if (banChoice === "24h") return 86400;
    if (banChoice === "7d") return 604800;
    if (banChoice === "30d") return 2592000;

    const amount = Number(banDuration);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    if (banUnit === "minutes") return Math.round(amount * 60);
    if (banUnit === "hours") return Math.round(amount * 3600);
    return Math.round(amount * 86400);
  }

  async function submitBan() {
    if (!banDialogUser) return;

    const cleanReason = banReason.trim();
    if (!cleanReason) {
      setMessage("Tu dois indiquer une raison avant de bannir cet utilisateur.");
      return;
    }

    if (banChoice === "permanent") {
      if (!window.confirm(`⚠️ BAN DÉFINITIF : supprimer définitivement le compte de ${banDialogUser.username || banDialogUser.email} ? Cette action est irréversible.`)) return;

      const success = await manageUser(banDialogUser, "delete");
      if (success) closeBanDialog();
      return;
    }

    const seconds = getDurationSeconds();
    if (!seconds) {
      setMessage("Indique une durée valide.");
      return;
    }

    const success = await manageUser(banDialogUser, "ban", seconds, cleanReason);
    if (success) closeBanDialog();
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

    await logAudit("admin_toggle_activity", {
      activity_id: activity.id,
      activity: activity.title,
      is_active: !activity.is_active
    }, "/admin");

    setActivities(list =>
      list.map(a => a.id === activity.id ? { ...a, is_active: !a.is_active } : a)
    );
  }

  const isBanned = (u: Profile) => !!u.is_suspended && (!u.ban_until || new Date(u.ban_until).getTime() > Date.now());
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
          <Link href="/admin/logs">Logs</Link>
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
          <div>
            <h2>Utilisateurs</h2>
            <p>Un seul bouton pour gérer le bannissement, avec durée personnalisée, BAN DÉF et débannissement.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/admin/logs" className="adminRefresh">Logs</Link>
            <button className="adminRefresh" onClick={load}>Actualiser</button>
          </div>
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

                  {activeBan && (
                    <>
                      <span className="muted">⛔ Motif : {user.ban_reason || "Non précisé"}</span>
                      <span className="muted">
                        ⏳ {user.ban_until ? `Bannissement restant : ${remainingTime(user.ban_until)}` : "Bannissement définitif"}
                      </span>
                    </>
                  )}
                </div>

                <div className="adminUserMeta">
                  <b>{user.points_balance || 0} AdPoints</b>
                  <span className={activeBan ? "status suspended" : "status activeStatus"}>
                    {activeBan ? "Banni" : "Actif"}
                  </span>

                  {activeBan ? (
                    <button disabled={busy} onClick={() => manageUser(user, "unban")}>
                      {busy ? "..." : "Débannir"}
                    </button>
                  ) : (
                    <button disabled={busy} onClick={() => openBanDialog(user)}>
                      {busy ? "..." : "Bannir"}
                    </button>
                  )}
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
        <div className="adminModalBackdrop" onClick={closeBanDialog}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <h2>🚫 Gérer {banDialogUser.username || banDialogUser.email}</h2>
            <p className="muted">Choisis une durée dans la liste, ou sélectionne BAN DÉF.</p>

            <label>Durée du bannissement</label>
            <select
              value={banChoice}
              onChange={(e) => setBanChoice(e.target.value as BanChoice)}
            >
              <option value="1h">1 heure</option>
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="custom">Durée personnalisée</option>
              <option value="permanent">BAN DÉF — suppression définitive du compte</option>
            </select>

            {banChoice === "custom" && (
              <div className="banDurationRow">
                <input
                  type="number"
                  min="1"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                />
                <select
                  value={banUnit}
                  onChange={(e) => setBanUnit(e.target.value as "minutes" | "hours" | "days")}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Heures</option>
                  <option value="days">Jours</option>
                </select>
              </div>
            )}

            <label>Raison</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={banChoice === "permanent" ? "Indique la raison de la suppression définitive..." : "Indique la raison du bannissement..."}
            />

            <div className="adminModalActions">
              <button onClick={closeBanDialog}>Annuler</button>
              <button
                className={banChoice === "permanent" ? "permanentBanButton" : "danger"}
                onClick={submitBan}
              >
                {banChoice === "permanent" ? "BAN DÉF" : "Bannir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
