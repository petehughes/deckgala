"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  callbackURL: string;
  googleEnabled: boolean;
  appleEnabled: boolean;
}

export function AuthForm({ mode, callbackURL, googleEnabled, appleEnabled }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const result = mode === "sign-up"
        ? await authClient.signUp.email({
            name: String(formData.get("name") ?? ""),
            email,
            password,
            callbackURL,
          })
        : await authClient.signIn.email({ email, password, callbackURL });
      if (result.error) {
        setError(result.error.message ?? "Unable to authenticate");
        return;
      }
      router.replace(callbackURL);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to authenticate");
    } finally {
      setPending(false);
    }
  }

  async function socialSignIn(provider: "google" | "apple") {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({ provider, callbackURL });
      if (result.error) {
        setError(result.error.message ?? "Unable to sign in");
        setPending(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
      setPending(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <p className="eyebrow">{mode === "sign-up" ? "Create your account" : "Welcome back"}</p>
      <h1>{mode === "sign-up" ? "Start with your club." : "Sign in to AquaTeamHub."}</h1>
      <p className="muted">One secure account for every club you manage.</p>
      {googleEnabled && <button className="button-secondary auth-provider" disabled={pending} onClick={() => socialSignIn("google")}>Continue with Google</button>}
      {appleEnabled && <button className="button-secondary auth-provider" disabled={pending} onClick={() => socialSignIn("apple")}>Continue with Apple</button>}
      {(googleEnabled || appleEnabled) && <div className="auth-divider"><span>or use email</span></div>}
      <form action={submit} className="auth-form">
        {mode === "sign-up" && <label>Your name<input name="name" autoComplete="name" required maxLength={120} /></label>}
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} required /></label>
        <button type="submit" disabled={pending}>{pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
      </form>
      {error && <p className="notice-error" role="alert">{error}</p>}
      <p className="auth-switch">
        {mode === "sign-up" ? "Already have an account?" : "New to AquaTeamHub?"}{" "}
        <a href={`/${mode === "sign-up" ? "sign-in" : "sign-up"}?callbackURL=${encodeURIComponent(callbackURL)}`}>
          {mode === "sign-up" ? "Sign in" : "Create an account"}
        </a>
      </p>
    </section>
  );
}
