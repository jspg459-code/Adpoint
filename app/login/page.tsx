"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { logAudit } from "../lib/audit";

function frenchError(error:string){
  const e=error.toLowerCase();
  if(e.includes("invalid login credentials")) return "Adresse e-mail ou mot de passe incorrect.";
  if(e.includes("email not confirmed")) return "Ton adresse e-mail n’est pas encore confirmée.";
  if(e.includes("too many requests") || e.includes("rate limit")) return "Trop de tentatives. Réessaie dans quelques instants.";
  if(e.includes("network")) return "Erreur de connexion au réseau. Réessaie.";
  return "Une erreur est survenue. Vérifie tes informations et réessaie.";
}

function formatRemaining(date:string){
  const ms=new Date(date).getTime()-Date.now();
  const total=Math.max(0,Math.ceil(ms/60000));
  const d=Math.floor(total/1440);
  const h=Math.floor((total%1440)/60);
  const m=total%60;
  if(d>0) return `${d} jour(s), ${h} heure(s)`;
  if(h>0) return `${h} heure(s), ${m} minute(s)`;
  return `${m} minute(s)`;
}

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

    if(error){
      setLoading(false);
      setMessage(frenchError(error.message));
      return;
    }

    if(!data.session || !data.user){
      setLoading(false);
      setMessage("Connexion impossible. Réessaie dans quelques secondes.");
      return;
    }

    const {data:profile}=await supabase
      .from("profiles")
      .select("ban_until,ban_reason,is_suspended")
      .eq("id",data.user.id)
      .single();

    const activeBan=profile?.ban_until && new Date(profile.ban_until).getTime()>Date.now();

    if(activeBan){
      await supabase.auth.signOut();
      setLoading(false);
      const reason=profile?.ban_reason ? ` Motif : ${profile.ban_reason}.` : "";
      setMessage(`⛔ Ton compte est banni. Temps restant : ${formatRemaining(profile.ban_until!)}.${reason}`);
      return;
    }

    if(profile?.is_suspended && !profile?.ban_until){
      await supabase.auth.signOut();
      setLoading(false);
      setMessage("⛔ Ton compte est actuellement suspendu. Contacte l’administrateur.");
      return;
    }

    await logAudit("login_success", { method: "password" }, "/login");
    setLoading(false);
    router.replace("/dashboard");
  }

  async function forgotPassword(){
    const cleanEmail=email.trim().toLowerCase();

    if(!cleanEmail){
      setMessage("Entre d’abord ton adresse e-mail pour recevoir le lien de réinitialisation.");
      return;
    }

    setSendingReset(true);
    setMessage("");

    const {error}=await supabase.auth.resetPasswordForEmail(cleanEmail,{
      redirectTo:`${window.location.origin}/reset-password`
    });

    setSendingReset(false);

    if(error){
      setMessage(frenchError(error.message));
      return;
    }

    setMessage("Un e-mail de réinitialisation vient d’être envoyé. Vérifie ta boîte de réception.");
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

        <button
          type="button"
          className="forgotPassword"
          onClick={forgotPassword}
          disabled={sendingReset}
        >
          {sendingReset ? "Envoi du lien..." : "Mot de passe oublié ?"}
        </button>

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {message&&<div className={message.startsWith("Un e-mail")?"notice":"error"}>{message}</div>}

      <div className="switch">
        Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
      </div>
    </section>
  </main>;
}