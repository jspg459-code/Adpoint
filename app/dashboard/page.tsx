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
 const [blocked,setBlocked]=useState<{reason:string;type:"suspended"|"banned"}|null>(null);

 useEffect(()=>{
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let mounted = true;

  async function initialize(){
   await load();
   const {data:{user}}=await supabase.auth.getUser();
   if(!user || !mounted) return;

   channel=supabase
    .channel("dashboard-points-"+user.id)
    .on(
     "postgres_changes",
     {event:"UPDATE",schema:"public",table:"profiles",filter:"id=eq."+user.id},
     (payload)=>{
      if(!mounted) return;
      setProfile((current:any)=>({...current,...(payload.new as any)}));
     }
    )
    .subscribe();
  }

  void initialize();

  return ()=>{
   mounted=false;
   if(channel) void supabase.removeChannel(channel);
  };
 },[]);

 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}

  const [{data:p},{data:balanceRow},{data:a}]=await Promise.all([
   supabase.from("profiles").select("username,email,role,ban_until,is_suspended,ban_reason").eq("id",user.id).single(),
   supabase.from("profiles").select("points_balance").eq("id",user.id).single(),
   supabase.from("activities").select("*").eq("is_active",true).order("created_at")
  ]);

  // Le solde affiché dans le tableau de bord utilise exactement la même
  // source de vérité que le compteur global fixe.
  const currentProfile={
   ...(p||{}),
   points_balance:Number(balanceRow?.points_balance??0)
  };

  const activeBan=currentProfile?.ban_until && new Date(currentProfile.ban_until).getTime()>Date.now();
  const activeSuspension=!!currentProfile?.is_suspended && !currentProfile?.ban_until;
  if(activeBan || activeSuspension){
   setBlocked({
    type: activeSuspension ? "suspended" : "banned",
    reason: currentProfile?.ban_reason || (activeSuspension ? "Ton compte a été suspendu par l'administration." : "Ton compte est actuellement banni.")
   });
   setProfile(currentProfile);
   return;
  }

  setBlocked(null);
  setProfile(currentProfile); setUsername(currentProfile?.username||""); setActivities(a||[]);
  // Tous les comptes ayant le rôle admin voient l'accès Administration.
  // Seul le propriétaire peut nommer d'autres administrateurs (contrôle côté panel/serveur).
  setIsAdmin(currentProfile?.role === "admin" || currentProfile?.role === "creator");
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

 if(blocked){
  return <main className="dash">
   <section className="dashHero" style={{minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div className="profileBox" style={{maxWidth:680,width:"100%",textAlign:"center"}}>
     <span className="eyebrow">{blocked.type==="suspended" ? "COMPTE SUSPENDU" : "ACCÈS BLOQUÉ"}</span>
     <h1>{blocked.type==="suspended" ? "Votre compte est suspendu" : "Votre compte est temporairement bloqué"}</h1>
     <p className="muted" style={{fontSize:18,lineHeight:1.6}}>{blocked.reason}</p>
     {blocked.type==="suspended" && <p className="muted">Votre accès à AdPoints restera bloqué jusqu'à ce qu'un créateur ou un administrateur désuspende votre compte.</p>}
     <button onClick={logout}>Se déconnecter</button>
    </div>
   </section>
  </main>;
 }

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