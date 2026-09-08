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
  role: string | null;
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
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; username: string | null; email: string; role: string | null; last_seen: string }>>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);

  const [banDialogUser, setBanDialogUser] = useState<Profile | null>(null);
  const [banChoice, setBanChoice] = useState<BanChoice>("24h");
  const [banDuration, setBanDuration] = useState("24");
  const [banUnit, setBanUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [banReason, setBanReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("Suspension décidée par l’administrateur.");

  const [usernameDialogUser, setUsernameDialogUser] = useState<Profile | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [pointsDialogUser, setPointsDialogUser] = useState<Profile | null>(null);
  const [pointsDelta, setPointsDelta] = useState("");

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isOwner) return;
    const timer = window.setInterval(() => void loadOnlineUsers(), 30000);
    return () => window.clearInterval(timer);
  }, [isOwner]);

  async function loadOnlineUsers() {
    setOnlineLoading(true);
    try {
      const cutoff = new Date(Date.now() - 90000).toISOString();
      const { data: presence, error: presenceError } = await supabase
        .from("user_presence")
        .select("user_id,last_seen")
        .gte("last_seen", cutoff)
        .order("last_seen", { ascending: false });

      if (presenceError) throw presenceError;

      const ids = (presence || []).map((item: any) => item.user_id);
      if (!ids.length) {
        setOnlineUsers([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,username,email,role")
        .in("id", ids);

      if (profilesError) throw profilesError;

      const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      setOnlineUsers(
        (presence || [])
          .map((item: any) => {
            const profile = profileById.get(item.user_id);
            return profile ? { ...profile, last_seen: item.last_seen } : null;
          })
          .filter(Boolean)
      );
    } catch (error: any) {
      setMessage(error?.message || "Impossible de charger les personnes en ligne.");
    } finally {
      setOnlineLoading(false);
    }
  }

  async function load() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/dashboard");
      return;
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (me?.role !== "admin" && me?.role !== "creator") {
      router.replace("/dashboard");
      return;
    }

    const creator = me?.role === "creator";
    setIsOwner(creator);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email,username,points_balance,is_suspended,ban_until,ban_reason,created_at,role")
      .order("created_at", { ascending: false });

    if (profilesError) {
      setMessage(profilesError.message || "Erreur de chargement.");
    }

    setUsers(profiles || []);
    if (creator) await loadOnlineUsers();
    setLoading(false);
  }

  async function manageUser(
    profile: Profile,
    action: "ban" | "unban" | "delete" | "suspend",
    durationSeconds?: number,
    reason?: string
  ) {
    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        // La suspension est une action distincte du bannissement : pas de durée automatique.
        action,
        userId: profile.id,
        durationSeconds,
        reason: (action === "ban" || action === "suspend")
          ? (reason || (action === "suspend" ? "Suspension décidée par l’administrateur." : "Bannissement décidé par l’administrateur."))
          : undefined
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
      const wasSuspended = !!profile.is_suspended && !profile.ban_until;
      await logAudit(wasSuspended ? "admin_unsuspend_user" : "admin_unban_user", { target_user_id: profile.id, target: profile.username || profile.email }, "/admin");
      setUsers(list =>
        list.map(u =>
          u.id === profile.id
            ? { ...u, is_suspended: false, ban_until: null, ban_reason: null }
            : u
        )
      );
      setMessage(wasSuspended ? "Utilisateur désuspendu avec succès." : "Utilisateur débanni avec succès.");
      return true;
    }

    if (action === "suspend") {
      await logAudit("admin_suspend_user", {
        target_user_id: profile.id,
        target: profile.username || profile.email,
        reason: reason || "Suspension décidée par l’administrateur."
      }, "/admin");
      setUsers(list =>
        list.map(u =>
          u.id === profile.id
            ? {
                ...u,
                is_suspended: true,
                ban_until: null,
                ban_reason: reason || "Suspension décidée par l’administrateur."
              }
            : u
        )
      );
      setMessage("Utilisateur suspendu avec succès.");
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

  async function sendPasswordReset(profile: Profile) {
    if (!isOwner) return;

    const label = profile.username || profile.email;
    if (!window.confirm(`Envoyer un email de réinitialisation du mot de passe à ${label} ?`)) return;

    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "send_password_reset", userId: profile.id }
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Impossible d'envoyer l'email de réinitialisation.");
      return;
    }

    await logAudit("owner_send_password_reset", {
      target_user_id: profile.id,
      target: label
    }, "/admin");

    setMessage(`Un email de réinitialisation du mot de passe a été envoyé à ${profile.email}.`);
  }

  async function toggleCreator(profile: Profile) {
    if (!isOwner) return;

    const makeCreator = profile.role !== "creator";
    const label = profile.username || profile.email;

    if (!window.confirm(makeCreator
      ? `Nommer ${label} créateur ? Cette personne aura les droits complets de créateur.`
      : `Retirer le rôle créateur de ${label} ?`
    )) return;

    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        action: "set_creator",
        userId: profile.id,
        makeCreator
      }
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Impossible de modifier les droits créateur.");
      return;
    }

    await logAudit(makeCreator ? "owner_promote_creator" : "owner_remove_creator", {
      target_user_id: profile.id,
      target: label
    }, "/admin");

    setUsers(list => list.map(u =>
      u.id === profile.id ? { ...u, role: makeCreator ? "creator" : "user" } : u
    ));
    setMessage(makeCreator ? `${label} est maintenant créateur.` : `Le rôle créateur de ${label} a été retiré.`);
  }

  async function toggleAdmin(profile: Profile) {
    if (!isOwner) return;

    const makeAdmin = profile.role !== "admin";
    const label = profile.username || profile.email;

    if (!window.confirm(makeAdmin
      ? `Nommer ${label} administrateur ?`
      : `Retirer les droits administrateur de ${label} ?`
    )) return;

    setBusyId(profile.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        action: "set_admin",
        userId: profile.id,
        makeAdmin
      }
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Impossible de modifier les droits administrateur.");
      return;
    }

    await logAudit(makeAdmin ? "owner_promote_admin" : "owner_remove_admin", {
      target_user_id: profile.id,
      target: label
    }, "/admin");

    setUsers(list => list.map(u =>
      u.id === profile.id ? { ...u, role: makeAdmin ? "admin" : "user" } : u
    ));
    setMessage(makeAdmin ? `${label} est maintenant administrateur.` : `Les droits administrateur de ${label} ont été retirés.`);
  }

  function openUsernameDialog(profile: Profile) {
    setUsernameDialogUser(profile);
    setEditUsername(profile.username || "");
    setMessage("");
  }

  function closeUsernameDialog() {
    setUsernameDialogUser(null);
    setEditUsername("");
  }

  async function saveUsername() {
    if (!usernameDialogUser) return;

    const username = editUsername.trim();
    if (!username) {
      setMessage("Le pseudo ne peut pas être vide.");
      return;
    }
    if (username.length < 3 || username.length > 40) {
      setMessage("Le pseudo doit contenir entre 3 et 40 caractères.");
      return;
    }

    setBusyId(usernameDialogUser.id);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("admin_update_username", {
        p_user_id: usernameDialogUser.id,
        p_username: username
      });
      if (error) throw new Error(error.message);

      const savedUsername = typeof data === "string" && data ? data : username;

      await logAudit("admin_update_username", {
        target_user_id: usernameDialogUser.id,
        previous_username: usernameDialogUser.username || null,
        username: savedUsername
      }, "/admin");

      setUsers(list => list.map(u =>
        u.id === usernameDialogUser.id ? { ...u, username: savedUsername } : u
      ));

      closeUsernameDialog();
      setMessage("Pseudo modifié avec succès.");
    } catch (err: any) {
      setMessage(err?.message || "Impossible de modifier le pseudo.");
    } finally {
      setBusyId(null);
    }
  }

  function openPointsDialog(profile: Profile) {
    if (!isOwner) return;
    setPointsDialogUser(profile);
    setPointsDelta("");
    setMessage("");
  }

  function closePointsDialog() {
    setPointsDialogUser(null);
    setPointsDelta("");
  }

  async function savePoints() {
    if (!isOwner || !pointsDialogUser) {
      setMessage("Seul le créateur peut modifier les AdPoints.");
      return;
    }
    const delta = Number(pointsDelta.trim());

    if (!Number.isFinite(delta) || delta === 0) {
      setMessage("Indique un nombre différent de 0 pour modifier les AdPoints.");
      return;
    }

    const nextPoints = Math.max(0, (pointsDialogUser.points_balance || 0) + delta);
    setBusyId(pointsDialogUser.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "adjust_points", userId: pointsDialogUser.id, pointsBalance: nextPoints }
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Impossible de modifier les AdPoints.");
      return;
    }

    await logAudit("admin_adjust_points", {
      target_user_id: pointsDialogUser.id,
      delta,
      previous_points: pointsDialogUser.points_balance || 0,
      points_balance: nextPoints
    }, "/admin");

    setUsers(list => list.map(u =>
      u.id === pointsDialogUser.id ? { ...u, points_balance: nextPoints } : u
    ));
    setMessage(delta > 0 ? "AdPoints ajoutés avec succès." : "AdPoints retirés avec succès.");
    closePointsDialog();
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

  async function suspendUser(profile: Profile) {
    const reason = suspendReason.trim() || "Suspension décidée par l’administrateur.";
    const label = profile.username || profile.email;
    if (!window.confirm(`Suspendre ${label} ? L'utilisateur ne pourra plus accéder à son compte jusqu'à ce qu'un créateur ou un administrateur le désuspende.`)) return;
    await manageUser(profile, "suspend", undefined, reason);
  }


  const isBanned = (u: Profile) => !!u.is_suspended && !!u.ban_until && new Date(u.ban_until).getTime() > Date.now();
  const isSuspended = (u: Profile) => !!u.is_suspended && !u.ban_until;
  const banned = users.filter(isBanned).length;
  const suspended = users.filter(isSuspended).length;
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
        <article><small>Comptes suspendus</small><strong>{suspended}</strong></article>
        <article><small>AdPoints en circulation</small><strong>{totalPoints}</strong></article>
        {isOwner && (
          <button
            type="button"
            className="onlineStatCard"
            onClick={() => {
              setShowOnlineUsers(true);
              void loadOnlineUsers();
            }}
          >
            <small>Personnes en ligne</small>
            <strong>{onlineLoading ? "..." : onlineUsers.length}</strong>
            <span>Voir qui est en ligne →</span>
          </button>
        )}
      </section>

      {message && <div className="profileMessage error">{message}</div>}

      <section className="adminSection">
        <div className="adminSectionHead">
          <div>
            <h2>Utilisateurs</h2>
            <p>Gère les bannissements et les suspensions. Le créateur et les admins peuvent désuspendre un utilisateur.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/admin/logs" className="adminRefresh">Logs</Link>
            <button className="adminRefresh" onClick={load}>Actualiser</button>
          </div>
        </div>

        <div className="adminList">
          {users.map(user => {
            const activeBan = isBanned(user);
            const activeSuspension = isSuspended(user);
            const busy = busyId === user.id;
            const isCreatorAccount = user.role === "creator" || user.email?.toLowerCase() === "jspg459@gmail.com";
            const protectedFromCurrentAdmin = isCreatorAccount && !isOwner;

            return (
              <article className="adminUser" key={user.id}>
                <div>
                  <strong>{user.username || "Sans pseudo"}</strong>
                  <span>{user.email}</span>

                  {(activeBan || activeSuspension) && (
                    <>
                      <span className="muted">{activeSuspension ? "⏸️" : "⛔"} Motif : {user.ban_reason || "Non précisé"}</span>
                      {activeBan && <span className="muted">⏳ Bannissement restant : {remainingTime(user.ban_until!)}</span>}
                      {activeSuspension && <span className="muted">⏸️ Compte suspendu jusqu'à désuspension par un créateur ou un admin.</span>}
                    </>
                  )}
                </div>

                <div className="adminUserMeta">
                  <b>{user.points_balance || 0} AdPoints</b>
                  <span className={(activeBan || activeSuspension) ? "status suspended" : "status activeStatus"}>
                    {activeBan ? "Banni" : activeSuspension ? "Suspendu" : "Actif"}
                  </span>
                  {user.role === "creator" && <span className="status activeStatus">Créateur</span>}
                  {user.role === "admin" && <span className="status activeStatus">Admin</span>}

                  {isOwner && user.email?.toLowerCase() !== "jspg459@gmail.com" && (
                    <button
                      className="adminUserAction adminCompactAction"
                      disabled={busy}
                      onClick={() => sendPasswordReset(user)}
                    >
                      {busy ? "..." : "Réinitialiser MDP"}
                    </button>
                  )}

                  {!protectedFromCurrentAdmin && (
                    <Link
                      href={`/admin/logs?user=${user.id}`}
                      className="adminUserAction adminLogsButton"
                      aria-label={`Voir les logs de ${user.username || user.email}`}
                    >
                      Logs
                    </Link>
                  )}

                  {isOwner && user.email?.toLowerCase() !== "jspg459@gmail.com" && (
                    <>
                      <button
                        className="adminUserAction adminCompactAction"
                        disabled={busy}
                        onClick={() => toggleAdmin(user)}
                      >
                        {busy ? "..." : user.role === "admin" ? "Retirer admin" : "Nommer admin"}
                      </button>
                      <button
                        className="adminUserAction adminCompactAction"
                        disabled={busy}
                        onClick={() => toggleCreator(user)}
                      >
                        {busy ? "..." : user.role === "creator" ? "Retirer créateur" : "Nommer créateur"}
                      </button>
                    </>
                  )}

                  {!protectedFromCurrentAdmin && <>
                    <button
                      className="adminUserAction adminCompactAction"
                      disabled={busy}
                      onClick={() => openUsernameDialog(user)}
                    >
                      Pseudo
                    </button>

                    {isOwner && (
                      <button
                        className="adminUserAction adminCompactAction"
                        disabled={busy}
                        onClick={() => openPointsDialog(user)}
                      >
                        Points
                      </button>
                    )}

                  {activeSuspension ? (
                    <button className="adminUserAction" disabled={busy} onClick={() => manageUser(user, "unban")}>
                      {busy ? "..." : "Désuspendre"}
                    </button>
                  ) : activeBan ? (
                    <button className="adminUserAction" disabled={busy} onClick={() => manageUser(user, "unban")}>
                      {busy ? "..." : "Débannir"}
                    </button>
                  ) : (
                    <>
                      <button className="adminUserAction adminCompactAction" disabled={busy} onClick={() => suspendUser(user)}>
                        {busy ? "..." : "Suspendre"}
                      </button>
                      <button className="adminUserAction" disabled={busy} onClick={() => openBanDialog(user)}>
                        {busy ? "..." : "Bannir"}
                      </button>
                    </>
                  )}
                  </>}
                </div>
              </article>
            );
          })}
        </div>
      </section>



      {usernameDialogUser && (
        <div className="adminModalBackdrop" onClick={closeUsernameDialog}>
          <div className="adminModal userEditModal" onClick={(e) => e.stopPropagation()}>
            <h2>Modifier le pseudo</h2>
            <p className="muted">Modifie uniquement le pseudo de {usernameDialogUser.username || usernameDialogUser.email}.</p>
            {message && <div className="profileMessage error" style={{ marginBottom: 16 }}>{message}</div>}

            <label>Nouveau pseudo</label>
            <input
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="Pseudo de l'utilisateur"
              maxLength={40}
              autoFocus
            />

            <div className="adminModalActions">
              <button onClick={closeUsernameDialog}>Annuler</button>
              <button className="adminUserAction" disabled={busyId === usernameDialogUser.id} onClick={saveUsername}>
                {busyId === usernameDialogUser.id ? "..." : "Enregistrer le pseudo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pointsDialogUser && (
        <div className="adminModalBackdrop" onClick={closePointsDialog}>
          <div className="adminModal userEditModal" onClick={(e) => e.stopPropagation()}>
            <h2>Modifier les AdPoints</h2>
            <p className="muted">Ajoute ou retire des AdPoints sans modifier le pseudo.</p>

            <div className="pointsAdjustInfo">
              Solde actuel : <b>{pointsDialogUser.points_balance || 0} AdPoints</b>
            </div>

            <label>Variation des AdPoints</label>
            <input
              type="number"
              step="1"
              value={pointsDelta}
              onChange={(e) => setPointsDelta(e.target.value)}
              placeholder="Ex. 50 ou -50"
              autoFocus
            />
            <small className="muted">Nombre positif = ajouter • Nombre négatif = retirer</small>

            <div className="adminModalActions">
              <button onClick={closePointsDialog}>Annuler</button>
              <button className="adminUserAction" disabled={busyId === pointsDialogUser.id} onClick={savePoints}>
                {busyId === pointsDialogUser.id ? "..." : "Valider les points"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnlineUsers && isOwner && (
        <div className="adminModalBackdrop" onClick={() => setShowOnlineUsers(false)}>
          <div className="adminModal onlineUsersModal" onClick={(e) => e.stopPropagation()}>
            <div className="onlineUsersHeader">
              <div>
                <h2>Personnes en ligne</h2>
                <p className="muted">Utilisateurs actifs sur AdPoints au cours des 90 dernières secondes.</p>
              </div>
              <button type="button" onClick={() => setShowOnlineUsers(false)}>Fermer</button>
            </div>

            <div className="onlineUsersList">
              {onlineUsers.length === 0 ? (
                <div className="emptyConversation">
                  <strong>Aucune personne en ligne</strong>
                  <span>La liste se met automatiquement à jour.</span>
                </div>
              ) : (
                onlineUsers.map((person) => (
                  <article className="onlineUserItem" key={person.id}>
                    <span className="onlineDot" aria-hidden="true" />
                    <div>
                      <strong>{person.username || "Sans pseudo"}</strong>
                      <span>{person.role === "creator" ? "Créateur" : person.role === "admin" ? "Administrateur" : "Utilisateur"}</span>
                    </div>
                    <small>Actif maintenant</small>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {banDialogUser && (
        <div className="adminModalBackdrop" onClick={closeBanDialog}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <h2>🚫 Gérer {banDialogUser.username || banDialogUser.email}</h2>
            <p className="muted">Choisis la durée du bannissement. Les comptes peuvent ensuite être débannis.</p>

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
      <style jsx>{`
        .onlineStatCard {
          appearance: none;
          width: 100%;
          min-height: 150px;
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(104, 215, 160, 0.45);
          border-radius: 28px;
          padding: 28px 46px;
          background: rgba(31, 47, 62, 0.72);
          color: inherit;
          transition: transform .18s ease, border-color .18s ease;
        }
        .onlineStatCard:hover {
          transform: translateY(-2px);
          border-color: rgba(104, 215, 160, 0.9);
        }
        .onlineStatCard small,
        .onlineStatCard strong,
        .onlineStatCard span {
          display: block;
        }
        .onlineStatCard strong {
          margin-top: 18px;
          color: #72d6a7;
          font-size: 2.1rem;
        }
        .onlineStatCard span {
          margin-top: 10px;
          color: #a8b6c5;
          font-size: .92rem;
        }
        .onlineUsersModal {
          width: min(680px, 94vw);
          max-height: min(720px, 88vh);
          overflow: auto;
        }
        .onlineUsersHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .onlineUsersHeader h2 { margin: 0 0 8px; }
        .onlineUsersHeader button {
          flex: 0 0 auto;
          padding: 10px 16px;
        }
        .onlineUsersList {
          display: grid;
          gap: 10px;
        }
        .onlineUserItem {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid rgba(116, 154, 186, .32);
          border-radius: 18px;
          background: rgba(16, 31, 45, .45);
        }
        .onlineUserItem div { min-width: 0; flex: 1; display: grid; gap: 4px; }
        .onlineUserItem strong { color: #f1f5f9; }
        .onlineUserItem span { color: #9eb0c0; font-size: .9rem; }
        .onlineUserItem small { color: #75d8a8; white-space: nowrap; }
        .onlineDot {
          width: 11px;
          height: 11px;
          border-radius: 999px;
          background: #3bd17f;
          box-shadow: 0 0 0 5px rgba(59, 209, 127, .12);
          flex: 0 0 auto;
        }
        @media (max-width: 700px) {
          .onlineStatCard { min-height: 120px; padding: 24px; }
          .onlineUsersHeader { align-items: center; }
          .onlineUserItem small { display: none; }
        }
      `}</style>
    </main>
  );
}
