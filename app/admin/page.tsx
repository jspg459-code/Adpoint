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
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState("");

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
        supabase.from("profiles").select("id,email,username,points_balance,is_suspended,created_at").order("created_at", { ascending: false }),
        supabase.from("activities").select("*").order("created_at", { ascending: false })
      ]);

    if (profilesError || activitiesError) {
      setMessage(profilesError?.message || activitiesError?.message || "Erreur de chargement.");
    }

    setUsers(profiles || []);
    setActivities(acts || []);
    setLoading(false);
  }

  async function toggleSuspension(profile: Profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !profile.is_suspended })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUsers(list => list.map(u =>
      u.id === profile.id ? { ...u, is_suspended: !u.is_suspended } : u
    ));
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

  const suspended = users.filter(u => u.is_suspended).length;
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
        <p>Gestion complète d’AdPoints — accès réservé à ton compte.</p>
      </section>

      <section className="adminStats">
        <article><small>Utilisateurs</small><strong>{users.length}</strong></article>
        <article><small>Comptes suspendus</small><strong>{suspended}</strong></article>
        <article><small>AdPoints en circulation</small><strong>{totalPoints}</strong></article>
        <article><small>Activités</small><strong>{activities.length}</strong></article>
      </section>

      {message && <div className="profileMessage error">{message}</div>}

      <section className="adminSection">
        <div className="adminSectionHead">
          <div><h2>Utilisateurs</h2><p>Consulte et gère les comptes inscrits.</p></div>
          <button className="adminRefresh" onClick={load}>Actualiser</button>
        </div>

        <div className="adminList">
          {users.map(user => (
            <article className="adminUser" key={user.id}>
              <div>
                <strong>{user.username || "Sans pseudo"}</strong>
                <span>{user.email}</span>
              </div>
              <div className="adminUserMeta">
                <b>{user.points_balance || 0} AdPoints</b>
                <span className={user.is_suspended ? "status suspended" : "status activeStatus"}>
                  {user.is_suspended ? "Suspendu" : "Actif"}
                </span>
                <button onClick={() => toggleSuspension(user)}>
                  {user.is_suspended ? "Réactiver" : "Suspendre"}
                </button>
              </div>
            </article>
          ))}
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
