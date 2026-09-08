"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { usePointsBalance } from "../components/PointsProvider";

export default function ShopPage(){
 const router=useRouter();
 const [profile,setProfile]=useState<any>(null);
 // La boutique utilise exactement la même source de solde que le compteur
 // global afin qu'il soit impossible d'afficher deux montants différents.
 const { points, refreshPoints } = usePointsBalance();

 useEffect(()=>{
  void (async()=>{
   const {data:{user}}=await supabase.auth.getUser();
   if(!user){router.replace("/login");return;}

   const {data}=await supabase
    .from("profiles")
    .select("username,role")
    .eq("id",user.id)
    .single();

   setProfile(data||null);

   // Synchronise le solde partagé dès l'ouverture de la boutique.
   await refreshPoints();
  })();
 },[router,refreshPoints]);

 async function logout(){
  await supabase.auth.signOut();
  router.replace("/");
 }

 const isAdmin=profile?.role==="admin"||profile?.role==="creator";

 return <main className="dash">
  <header className="modernHeader cleanTopHeader">
   <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
   <nav className="cleanTextNav">
    <Link href="/dashboard">Tableau de bord</Link>
    <Link href="/ranking">Classement</Link>
    <Link href="/profile">Mon profil</Link>
    {isAdmin&&<Link href="/admin">Administration</Link>}
    <button onClick={logout}>Déconnexion</button>
   </nav>
  </header>

  <section className="shopPage">
   <span className="eyebrow">BOUTIQUE D’ÉCHANGE</span>
   <h1>Échange tes <b>AdPoints</b></h1>
   <p className="muted shopLead">Parcours les récompenses disponibles et utilise tes points pour obtenir les offres proposées.</p>

   <div className="shopBalanceCard">
    <span>Ton solde disponible</span>
    <strong>{(points ?? 0).toLocaleString("fr-FR")} AdPoints</strong>
   </div>

   <div className="shopEmpty">
    <div className="shopEmptyIcon">🛍️</div>
    <h2>La boutique est prête</h2>
    <p>Aucune récompense n’est disponible pour le moment. Les prochaines offres d’échange apparaîtront ici.</p>
    <Link href="/dashboard" className="shopBrowseButton">← Retour au tableau de bord</Link>
   </div>
  </section>
 </main>;
}
