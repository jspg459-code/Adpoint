"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Player={rank:number;username:string;points_balance:number;is_current_user:boolean};

export default function RankingPage(){
 const router=useRouter();
 const [players,setPlayers]=useState<Player[]>([]);
 const [loading,setLoading]=useState(true);
 const [isAdmin,setIsAdmin]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{load();},[]);

 async function load(){
  setLoading(true);setError("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  const [{data:profile},{data,error}]=await Promise.all([
   supabase.from("profiles").select("role").eq("id",user.id).single(),
   supabase.rpc("get_leaderboard",{p_limit:100})
  ]);
  setIsAdmin(profile?.role==="admin"||profile?.role==="creator");
  if(error){setError(error.message||"Impossible de charger le classement.");setPlayers([]);}
  else setPlayers((data||[]).map((p:any)=>({...p,rank:Number(p.rank),points_balance:Number(p.points_balance)})));
  setLoading(false);
 }

 async function logout(){await supabase.auth.signOut();router.replace("/");}
 const medals=["🥇","🥈","🥉"];

 return <main className="dash rankingPage">
  <header className="modernHeader cleanTopHeader">
   <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
   <nav className="cleanTextNav">
    <Link href="/dashboard">Tableau de bord</Link>
    <Link href="/ranking" className="active">Classement</Link>
    <Link href="/profile">Mon profil</Link>
    {isAdmin&&<Link href="/admin">Administration</Link>}
    <button onClick={logout}>Déconnexion</button>
   </nav>
  </header>

  <section className="rankingHero">
   <span className="eyebrow">CLASSEMENT</span>
   <h1>Les meilleurs <b>joueurs</b></h1>
   <p>Le classement évolue automatiquement selon le nombre d'AdPoints de chaque joueur.</p>
   <button className="rankingRefresh" onClick={load} disabled={loading}>{loading?"Actualisation...":"↻ Actualiser le classement"}</button>
  </section>

  <section className="rankingBoard">
   <div className="rankingBoardHeader"><span>Position</span><span>Joueur</span><span>AdPoints</span></div>
   {loading&&<div className="rankingEmpty">Chargement du classement...</div>}
   {!loading&&error&&<div className="rankingEmpty"><p>{error}</p><button onClick={load}>Réessayer</button></div>}
   {!loading&&!error&&players.map(player=><article key={player.rank+"-"+player.username} className={"rankingRow "+(player.is_current_user?"currentPlayer":"")}>
    <div className="rankNumber">{player.rank<=3?medals[player.rank-1]:<span>#{player.rank}</span>}</div>
    <div className="playerName"><div className="playerAvatar">{player.username.charAt(0).toUpperCase()}</div><div><strong>{player.username}</strong>{player.is_current_user&&<small>Toi</small>}</div></div>
    <div className="playerPoints">{player.points_balance.toLocaleString("fr-FR")} <span>AdPoints</span></div>
   </article>)}
   {!loading&&!error&&!players.length&&<div className="rankingEmpty">Aucun joueur à classer pour le moment.</div>}
  </section>

  <p className="rankingHint">💡 Gagne des AdPoints en réalisant les activités disponibles pour monter dans le classement.</p>

  <style jsx>{`
   .rankingPage{min-height:100vh}.rankingHero{max-width:900px;margin:45px auto 28px;padding:0 24px;text-align:center}.rankingHero h1{font-size:clamp(2.4rem,7vw,4.4rem);margin:14px 0}.rankingHero h1 b{color:#62d89c}.rankingHero p{color:#aebbc9;font-size:1.1rem;max-width:650px;margin:0 auto 24px}.rankingRefresh{border:0;border-radius:14px;padding:14px 20px;font-weight:800;cursor:pointer;background:#31b875;color:#092218;font-size:1rem}.rankingRefresh:disabled{opacity:.65;cursor:wait}.rankingBoard{max-width:900px;margin:0 auto;padding:0 24px 24px}.rankingBoardHeader,.rankingRow{display:grid;grid-template-columns:120px 1fr 180px;align-items:center;gap:16px}.rankingBoardHeader{color:#8e9cab;font-weight:700;padding:16px 24px;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}.rankingBoardHeader span:last-child{text-align:right}.rankingRow{background:#142432;border:1px solid #314557;border-radius:20px;padding:16px 24px;margin-bottom:12px;transition:.2s}.rankingRow:hover{transform:translateY(-2px);border-color:#4e7d71}.rankingRow.currentPlayer{border-color:#54d493;box-shadow:0 0 0 2px rgba(84,212,147,.12);background:linear-gradient(100deg,#17382e,#142432)}.rankNumber{font-size:1.15rem;font-weight:900;color:#dce4ec}.playerName{display:flex;align-items:center;gap:14px;min-width:0}.playerName strong{display:block;font-size:1.12rem}.playerName small{color:#62d89c;font-weight:800}.playerAvatar{width:46px;height:46px;flex:0 0 46px;border-radius:50%;display:grid;place-items:center;background:#244136;color:#7ee8af;font-weight:900;font-size:1.2rem}.playerPoints{text-align:right;font-weight:900;color:#6be3a2;font-size:1.08rem}.playerPoints span{color:#aebbc9;font-weight:700;font-size:.85rem}.rankingEmpty{text-align:center;background:#142432;border:1px solid #314557;border-radius:20px;padding:42px 20px;color:#aebbc9}.rankingEmpty button{margin-top:12px;background:#31b875;border:0;border-radius:12px;padding:10px 16px;font-weight:800}.rankingHint{max-width:900px;margin:10px auto 60px;padding:0 24px;text-align:center;color:#9dacba}@media(max-width:700px){.rankingHero{margin-top:28px}.rankingBoard{padding:0 14px 18px}.rankingBoardHeader{display:none}.rankingRow{grid-template-columns:58px 1fr;padding:14px;gap:10px}.playerPoints{grid-column:2;grid-row:2;text-align:left;padding-left:60px;margin-top:-8px}}
  `}</style>
 </main>;
}