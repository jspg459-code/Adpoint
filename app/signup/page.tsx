"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SignupPage(){
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault(); setMessage(""); setLoading(true);
    const {data,error}=await supabase.auth.signUp({email,password});
    if(error){setLoading(false);setMessage("Impossible de créer le compte pour le moment. Réessaie dans quelques minutes.");return;}
    if(data.user&&username.trim()){
      await supabase.from("profiles").update({username:username.trim()}).eq("id",data.user.id);
    }
    setLoading(false);
    if(data.session) router.replace("/dashboard");
    else setMessage("Compte créé ! Vérifie ton e-mail si une confirmation est demandée.");
  }

  return <main className="authPage"><Link className="back" href="/">← Retour à AdPoints</Link><section className="authCard"><div className="coinBig">◉</div><h1>Créer mon compte</h1><p>Commence à gagner des AdPoints.</p><form onSubmit={submit}><input placeholder="Pseudo" value={username} onChange={e=>setUsername(e.target.value)} required minLength={3}/><input type="email" placeholder="Adresse e-mail" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Mot de passe (6 caractères minimum)" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/><button disabled={loading}>{loading?"Création...":"Créer mon compte"}</button></form>{message&&<div className="notice">{message}</div>}<div className="switch">Déjà un compte ? <Link href="/login">Connexion</Link></div></section></main>;
}