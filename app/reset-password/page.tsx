"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage(){
  const router=useRouter();
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();
    setMessage("");

    if(password.length<6){
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if(password!==confirmPassword){
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const {error}=await supabase.auth.updateUser({password});
    setLoading(false);

    if(error){
      setMessage(error.message);
      return;
    }

    setMessage("Mot de passe modifié avec succès !");
    setTimeout(()=>router.replace("/login"),1200);
  }

  return <main className="authPage">
    <Link className="back" href="/login">← Retour à la connexion</Link>
    <section className="authCard">
      <div className="coinBig">◉</div>
      <h1>Nouveau mot de passe</h1>
      <p>Choisis un nouveau mot de passe pour ton compte.</p>
      <form onSubmit={submit}>
        <input type="password" placeholder="Nouveau mot de passe" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/>
        <input type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={6} required/>
        <button disabled={loading}>{loading?"Modification...":"Modifier le mot de passe"}</button>
      </form>
      {message&&<div className={message.includes("succès")?"notice":"error"}>{message}</div>}
    </section>
  </main>;
}