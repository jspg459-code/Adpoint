"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../lib/supabase";
import { logAudit } from "../lib/audit";

export default function Dashboard(){
 const router=useRouter();
 const [profile,setProfile]=useState<any>(null);
 const [activities,setActivities]=useState<any[]>([]);
 const [username,setUsername]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [isAdmin,setIsAdmin]=useState(false);

 useEffect(()=>{load();},[]);

 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}

  const [{data:p},{data:a}]=await Promise.all([
   supabase.from("profiles").select("username,email,points_balance,role,ban_until,is_suspended").eq("id",user.id).single(),
   supabase.from("activities").select("*").eq("is_active",true).order("created_at")
  ]);

  const activeBan=p?.ban_until && new Date(p.ban_until).getTime()>Date.now();
  if(activeBan || (p?.is_suspended && !p?.ban_until)){
   await supabase.auth.signOut();
   router.replace("/login");
   return;
  }

  setProfile(p); setUsername(p?.username||""); setActivities(a||[]);
  // Tous les comptes ayant le rôle admin voient l'accès Administration.
  // Seul le propriétaire peut nommer d'autres administrateurs (contrôle côté panel/serveur).
  setIsAdmin(p?.role === "admin" || p?.role === "creator");
 }

 async function save(){
  const clean=username.trim();
  if(clean.length<3){setMessage("Le pseudo doit contenir au moins 3 caractères.");return;}
  setSaving(true);setMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {error}=await supabase.from("profiles").update({username:clean}).eq("id",user.id);
   if(error) setMessage(error.message);
   else {setProfile((p:any)=>({...p,username:clean}));await logAudit("dashboard_username_saved",{username:clean},"/dashboard");setMessage("Pseudo enregistré ✓");}
  }
  setSaving(false);
 }

 async function logout(){await logAudit("logout",{},"/dashboard");await supabase.auth.signOut();router.replace("/");}

 const needsUsername=!profile?.username?.trim();

 return <main className="dash">
  <header className="modernHeader cleanTopHeader">
   <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
   <nav className="cleanTextNav">
    <Link href="/dashboard" className="active">Tableau de bord</Link>
    <Link href="/ranking">Classement</Link>
    <Link href="/profile">Mon profil</Link>
    {isAdmin&&<Link href="/admin">Administration</Link>}
    <button onClick={logout}>Déconnexion</button>
   </nav>
  </header>

  <section className="dashHero">
   <div><span className="eyebrow">BON RETOUR</span><h1>Bonjour {profile?.username||"👋"}</h1><p>Ton compte est connecté avec succès.</p></div>
   <div className="balance"><small>SOLDE</small><strong>{profile?.points_balance??0}</strong><span>AdPoints</span></div>
  </section>

  {needsUsername&&<section className="profileBox"><h2>Choisis ton pseudo</h2><p className="muted">Il sera affiché à la place de ton adresse e-mail. Tu pourras le modifier plus tard depuis ton profil.</p>
   <div className="profileRow"><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ton pseudo"/><button onClick={save} disabled={saving}>{saving?"Enregistrement...":"Enregistrer le pseudo"}</button></div>
   {message&&<div className="notice">{message}</div>}
  </section>}

  <section>
   <h2>Activités disponibles</h2>
   <div className="activityGrid">
    {activities.map(a=><article className="activity" key={a.id}><h3>{a.title}</h3><p>{a.description}</p><b>+{a.points_reward} AdPoints</b><button onClick={()=>alert("Cette activité est prête à être intégrée au système de validation sécurisé.")}>Voir l’activité</button></article>)}
    {!activities.length&&<p className="muted">Aucune activité disponible pour le moment.</p>}
   </div>
  </section>
 </main>;
}