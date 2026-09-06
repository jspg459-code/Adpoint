"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../lib/supabase";

export default function Dashboard(){
 const router=useRouter();
 const [profile,setProfile]=useState<any>(null);
 const [activities,setActivities]=useState<any[]>([]);
 const [username,setUsername]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>{load();},[]);

 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  const [{data:p},{data:a}]=await Promise.all([
   supabase.from("profiles").select("username,email,points_balance").eq("id",user.id).single(),
   supabase.from("activities").select("*").eq("is_active",true).order("created_at")
  ]);
  setProfile(p); setUsername(p?.username||""); setActivities(a||[]);
 }

 async function save(){
  const clean=username.trim();
  if(clean.length<3){setMessage("Le pseudo doit contenir au moins 3 caractères.");return;}
  setSaving(true);setMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {error}=await supabase.from("profiles").update({username:clean}).eq("id",user.id);
   if(error) setMessage(error.message);
   else {setProfile((p:any)=>({...p,username:clean}));setMessage("Pseudo enregistré ✓");}
  }
  setSaving(false);
 }

 async function logout(){await supabase.auth.signOut();router.replace("/");}

 const needsUsername=!profile?.username?.trim();

 return <main className="dash">
  <header>
   <Link href="/dashboard" className="brand"><span className="coin">◉</span>AdPoints</Link>
   <div className="userNav">
    <Link href="/dashboard">Tableau de bord</Link>
    <Link href="/profile" className="profileLink">{profile?.username||"Mon profil"} <span className="avatar">◉</span></Link>
    <button className="linkButton" onClick={logout}>Déconnexion</button>
   </div>
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