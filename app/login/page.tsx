"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage(){
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [sendingReset,setSendingReset]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const cleanEmail=email.trim().toLowerCase();
    const {data,error}=await supabase.auth.signInWithPassword({
      email:cleanEmail,
      password
    });

    setLoading(false);

    if(error){
      if(error.message.toLowerCase().includes("invalid login credentials")){
        setMessage("Adresse e-mail ou mot de passe incorrect.");
      }else{
        setMessage(error.message);
      }
      return;
    }

    if(!data.session){
      setMessage("Connexion impossible. Réessaie dans quelques secondes.");
      return;
    }

    router.replace("/dashboard");
  }

  async function forgotPassword(){
    const cleanEmail=email.trim().toLowerCase();
    if(!cleanEmail){
      setMessage("Entre ton adresse e-mail puis appuie sur « Mot de passe oublié ? »");
      return;
    }

    setSendingReset(true);
    setMessage("");

    const {error}=await supabase.auth.resetPasswordForEmail(cleanEmail,{
      redirectTo:`${window.location.origin}/reset-password`
    });

    setSendingReset(false);

    if(error){
      setMessage(error.message);
      return;
    }

    setMessage("Un e-mail de réinitialisation vient d’être envoyé si cette adresse possède un compte.");
  }

  return <main className="authPage">
    <Link className="back" href="/">← Retour à AdPoints</Link>
    <section className="authCard">
      <div className="coinBig">◉</div>
      <h1>Connexion</h1>
      <p>Content de te revoir.</p>

      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button disabled={loading}>{loading?"Connexion...":"Se connecter"}</button>
      </form>

      <button type="button" className="forgotPassword" onClick={forgotPassword} disabled={sendingReset}>
        {sendingReset ? "Envoi en cours..." : "Mot de passe oublié ?"}
      </button>

      {message&&<div className={message.startsWith("Un e-mail")?"notice":"error"}>{message}</div>}

      <div className="switch">Pas encore de compte ? <Link href="/signup">Créer mon compte</Link></div>
    </section>
  </main>;
}