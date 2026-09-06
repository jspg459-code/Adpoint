"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage(){
  const router=useRouter();
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let mounted=true;

    async function prepareRecovery(){
      const params=new URLSearchParams(window.location.search);
      const code=params.get("code");

      if(code){
        const {error}=await supabase.auth.exchangeCodeForSession(code);
        if(error && mounted){
          setMessage("Ce lien de réinitialisation est invalide ou a expiré. Demande un nouveau lien.");
          return;
        }
      }

      const {data:{session}}=await supabase.auth.getSession();
      if(mounted){
        if(session){
          setReady(true);
        }else{
          setMessage("Lien de réinitialisation en cours de vérification. Si rien ne s'affiche, demande un nouveau lien.");
        }
      }
    }

    prepareRecovery();

    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if((event==="PASSWORD_RECOVERY" || event==="SIGNED_IN") && session && mounted){
        setReady(true);
        setMessage("");
      }
    });

    return ()=>{
      mounted=false;
      subscription.unsubscribe();
    };
  },[]);

  async function submit(e:FormEvent){
    e.preventDefault();
    setMessage("");

    if(!ready){
      setMessage("Le lien de réinitialisation n'est pas valide ou a expiré. Demande un nouveau lien.");
      return;
    }

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
      <p>{ready ? "Choisis un nouveau mot de passe pour ton compte." : "Vérification sécurisée de ton lien de réinitialisation..."}</p>
      <form onSubmit={submit}>
        <input type="password" placeholder="Nouveau mot de passe" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required disabled={!ready || loading}/>
        <input type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={6} required disabled={!ready || loading}/>
        <button disabled={!ready || loading}>{loading ? "Modification..." : ready ? "Modifier le mot de passe" : "Vérification du lien..."}</button>
      </form>
      {message&&<div className={message.includes("succès")?"notice":"error"}>{message}</div>}
    </section>
  </main>;
}