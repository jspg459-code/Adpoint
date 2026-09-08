"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../lib/supabase";
import { logAudit } from "../lib/audit";

export default function Dashboard(){
 const router=useRouter();
 const [profile,setProfile]=useState<any>(null);
 const [username,setUsername]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [isAdmin,setIsAdmin]=useState(false);
 const [blocked,setBlocked]=useState<{reason:string;type:"suspended"|"banned"}|null>(null);
 const [shopEnabled,setShopEnabled]=useState(false);
 const [shopChecked,setShopChecked]=useState(false);

 useEffect(()=>{
  void load();
 },[]);

 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}

  // Une seule lecture du profil : le tableau de bord et le compteur global
  // utilisent tous les deux profiles.points_balance comme source de vérité.
  const [{data:p,error:profileError}]=await Promise.all([
   supabase
    .from("profiles")
    .select("username,email,role,ban_until,is_suspended,ban_reason,points_balance")
    .eq("id",user.id)
    .single(),
  ]);

  if(profileError || !p){
   setProfile(null);
   return;
  }

  const currentProfile={
   ...p,
   points_balance:Number(p.points_balance ?? 0)
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
  setProfile(currentProfile); setUsername(currentProfile?.username||"");
  // Tous les comptes ayant le rôle admin voient l'accès Administration.
  // Seul le propriétaire peut nommer d'autres administrateurs (contrôle côté panel/serveur).
  setIsAdmin(currentProfile?.role === "admin" || currentProfile?.role === "creator");

  // L'ouverture de la boutique est un réglage global indépendant des offres.
  // Une boutique activée reste donc accessible même si aucune offre n'est encore publiée.
  const { data: shopSettings, error: shopSettingsError } = await supabase
   .from("site_settings")
   .select("shop_enabled")
   .eq("key", "global")
   .single();

  // Compatibilité : si le réglage n'est pas encore lisible, on évite de cacher
  // la boutique par erreur pendant le chargement.
  setShopEnabled(shopSettingsError ? true : shopSettings?.shop_enabled !== false);
  setShopChecked(true);
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

 // Évite le flash de « Choisis ton pseudo » pendant le chargement initial du profil.
 const needsUsername=!!profile && !profile.username?.trim();

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

  <section className="dashHero" style={{paddingBottom:"12px"}}>
   <div><span className="eyebrow">BON RETOUR</span><h1>Bonjour {profile?.username||"👋"}</h1></div>
  </section>

  {needsUsername&&<section className="profileBox"><h2>Choisis ton pseudo</h2><p className="muted">Il sera affiché à la place de ton adresse e-mail. Tu pourras le modifier plus tard depuis ton profil.</p>
   <div className="profileRow"><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ton pseudo"/><button onClick={save} disabled={saving}>{saving?"Enregistrement...":"Enregistrer le pseudo"}</button></div>
   {message&&<div className="notice">{message}</div>}
  </section>}

  {shopChecked && shopEnabled && (
   <section>
    <h2>Boutique d’échange</h2>
    <div className="activityGrid">
     <article className="activity exchangeShopCard">
      <h3>🛍️ Parcourir la boutique</h3>
      <p>Découvre les récompenses disponibles et échange tes AdPoints contre les offres proposées.</p>
      <Link href="/shop" className="shopBrowseButton">Voir la boutique d’échange →</Link>
     </article>
    </div>
   </section>
  )}
 </main>;
}