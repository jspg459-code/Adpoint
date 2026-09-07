"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  page: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  email: string;
};

function formatAction(action: string) {
  const labels: Record<string, string> = {
    page_view: "Consultation d’une page",
    click: "Clic / interaction"
  };
  return labels[action] || action.replace(/_/g, " ");
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");

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

    if (me?.role !== "creator") {
      router.replace("/dashboard");
      return;
    }

    const [{ data: auditRows, error: auditError }, { data: profileRows, error: profileError }] =
      await Promise.all([
        supabase
          .from("audit_logs")
          .select("id,user_id,action,page,details,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("profiles")
          .select("id,username,email")
      ]);

    if (auditError || profileError) {
      setMessage(auditError?.message || profileError?.message || "Impossible de charger les logs.");
    }

    const map: Record<string, Profile> = {};
    (profileRows || []).forEach((profile: Profile) => {
      map[profile.id] = profile;
    });

    setProfiles(map);
    setLogs((auditRows || []) as AuditLog[]);
    setLoading(false);
  }

  useEffect(() => {
    setSelectedUserId(new URLSearchParams(window.location.search).get("user") || "");
    load();
  }, []);

  const actions = useMemo(
    () => Array.from(new Set(logs.map(log => log.action))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter(log => {
      if (selectedUserId && log.user_id !== selectedUserId) return false;
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (!query) return true;

      const profile = log.user_id ? profiles[log.user_id] : undefined;
      const haystack = [
        log.action,
        log.page || "",
        profile?.username || "",
        profile?.email || "",
        JSON.stringify(log.details || {})
      ].join(" ").toLowerCase();

      return haystack.includes(query);
    });
  }, [logs, profiles, search, actionFilter, selectedUserId]);

  if (loading) {
    return <main className="dash adminPage"><p className="muted">Chargement des logs...</p></main>;
  }

  return (
    <main className="dash adminPage">
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/profile">Mon profil</Link>
          <Link href="/admin">Administration</Link>
          <Link href="/admin/logs" className="active">Logs</Link>
        </nav>
      </header>

      <section className="adminIntro">
        <span className="eyebrow">{selectedUserId ? "LOGS INDIVIDUELS" : "SUIVI DU SITE"}</span>
        <h1>{selectedUserId ? "Journal de l’" : "Journal des "}<b>{selectedUserId ? (profiles[selectedUserId]?.username || profiles[selectedUserId]?.email || "utilisateur") : "actions"}</b></h1>
        <p>{selectedUserId ? "Retrouve uniquement les actions réalisées par cet utilisateur." : "Retrouve les actions et les pages consultées par les utilisateurs connectés."}</p>
        {selectedUserId && <Link href="/admin/logs" className="adminRefresh">← Voir tous les logs</Link>}
      </section>

      <section className="adminStats">
        <article><small>Logs affichés</small><strong>{filteredLogs.length}</strong></article>
        <article><small>Utilisateurs suivis</small><strong>{new Set(logs.map(log => log.user_id).filter(Boolean)).size}</strong></article>
        <article><small>Actions différentes</small><strong>{actions.length}</strong></article>
        <article><small>Limite</small><strong>500</strong></article>
      </section>

      {message && <div className="profileMessage error">{message}</div>}

      <section className="adminSection">
        <div className="adminSectionHead">
          <div>
            <h2>Logs des utilisateurs</h2>
            <p>Les mots de passe et le contenu des champs sensibles ne sont jamais enregistrés.</p>
          </div>
          <button className="adminRefresh" onClick={load}>Actualiser</button>
        </div>

        <div className="profileRow" style={{ marginBottom: 18 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur, une action ou une page..."
          />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">Toutes les actions</option>
            {actions.map(action => <option key={action} value={action}>{formatAction(action)}</option>)}
          </select>
        </div>

        <div className="adminList">
          {filteredLogs.map(log => {
            const profile = log.user_id ? profiles[log.user_id] : undefined;
            const details = log.details && Object.keys(log.details).length
              ? Object.entries(log.details)
                  .filter(([key]) => !["label", "href", "path"].includes(key) || true)
                  .map(([key, value]) => key + ": " + String(value))
                  .join(" • ")
              : "";

            return (
              <article className="adminUser" key={log.id}>
                <div>
                  <strong>{profile?.username || profile?.email || "Utilisateur inconnu"}</strong>
                  <span>{profile?.email || "Compte supprimé ou non disponible"}</span>
                  <span className="muted">📍 {log.page || "Page non renseignée"}</span>
                  {details && <span className="muted">ℹ️ {details}</span>}
                </div>

                <div className="adminUserMeta">
                  <span className="status activeStatus">{formatAction(log.action)}</span>
                  <span className="muted">{new Date(log.created_at).toLocaleString("fr-FR")}</span>
                </div>
              </article>
            );
          })}

          {!filteredLogs.length && (
            <p className="muted">Aucun log ne correspond à ta recherche pour le moment.</p>
          )}
        </div>
      </section>
    </main>
  );
}
