"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../lib/supabase";

export default function Dashboard(){
 const router=useRouter();
 const [profile,setProfile]=useState<any>(null);
 const [activities,setActivities]=useState<any[]>([]);
 const [username,setUsername]=useState("");
 const [saving,setSaving]=useState(false);
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
  setSaving(true); const {data:{user}}=await supabase.auth.getUser();
  if(user){await supabase.from("profiles").update({username:username.trim()}).eq("id",user.id);setProfile((p:any)=>({...p,username:username.trim()}));}
  setSaving(false);
 }
 async function logout(){await supabase.auth.signOut();router.replace("/");}
 return <main className="dash"><header><div className="brand"><span className="coin">◉</span>AdPoints</div><button className="linkButton" onClick={logout}>Déconnexion</button></header><section className="dashHero"><div><span className="eyebrow">BON RETOUR</span><h1>Bonjour {profile?.username||"👋"}</h1><p>Ton compte est connecté avec succès.</p></div><div className="balance"><small>SOLDE</small><strong>{profile?.points_balance??0}</strong><span>AdPoints</span></div></section><section className="profileBox"><h2>Mon profil</h2><div className="profileRow"><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ton pseudo"/><button onClick={save} disabled={saving}>{saving?"Enregistrement...":"Enregistrer le pseudo"}</button></div></section><section><h2>Activités disponibles</h2><div className="activityGrid">{activities.map(a=><article className="activity" key={a.id}><h3>{a.title}</h3><p>{a.description}</p><b>+{a.points_reward} AdPoints</b><button onClick={()=>alert("Cette activité est prête à être intégrée au système de validation sécurisé.")}>Voir l’activité</button></article>)}{!activities.length&&<p className="muted">Aucune activité disponible pour le moment.</p>}</div></section></main>;
}