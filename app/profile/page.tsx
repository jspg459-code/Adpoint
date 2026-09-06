"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../lib/supabase";

export default function ProfilePage(){
 const router=useRouter();
 const [username,setUsername]=useState("");
 const [email,setEmail]=useState("");
 const [points,setPoints]=useState(0);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>{load();},[]);
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  setEmail(user.email||"");
  const {data}=await supabase.from("profiles").select("username,points_balance").eq("id",user.id).single();
  setUsername(data?.username||"");
  setPoints(data?.points_balance??0);
 }
 async function save(){
  const clean=username.trim();
  if(clean.length<3){setMessage("Le pseudo doit contenir au moins 3 caractères.");return;}
  setSaving(true);setMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {error}=await supabase.from("profiles").update({username:clean}).eq("id",user.id);
   setMessage(error?error.message:"Pseudo enregistré avec succès ✓");
  }
  setSaving(false);
 }
 async function logout(){await supabase.auth.signOut();router.replace("/");}

 return <main className="dash">
  <header>
   <Link href="/dashboard" className="brand"><span className="coin">◉</span>AdPoints</Link>
   <div className="userNav">
    <Link href="/dashboard">Tableau de bord</Link>
    <Link href="/profile" className="profileLink">Mon profil <span className="avatar">◉</span></Link>
    <button className="linkButton" onClick={logout}>Déconnexion</button>
   </div>
  </header>
  <section className="profilePage">
   <div className="profileCard">
    <span className="eyebrow">MON COMPTE</span>
    <h1>Mon profil</h1>
    <p className="muted">Modifie ton pseudo à tout moment. C’est lui qui sera affiché sur AdPoints.</p>
    <label>Pseudo</label>
    <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ton pseudo"/>
    <button onClick={save} disabled={saving}>{saving?"Enregistrement...":"Enregistrer les modifications"}</button>
    {message&&<div className="notice">{message}</div>}
    <div className="accountInfo"><div><small>ADRESSE E-MAIL</small><strong>{email}</strong></div><div><small>SOLDE</small><strong>{points} AdPoints</strong></div></div>
   </div>
  </section>
 </main>;
}