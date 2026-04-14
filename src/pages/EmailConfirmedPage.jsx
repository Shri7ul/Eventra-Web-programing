import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { hasSupabase, supabase } from "../lib/supabase";

export default function EmailConfirmedPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let isActive = true;

    async function verifyEmail() {
      if (!hasSupabase || !supabase) {
        if (isActive) {
          setStatus("success");
          setMessage("Email confirmed successfully.");
        }
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type
          });
          if (error) throw error;
        } else if (accessToken || hashType === "signup") {
          throw new Error("Unable to validate the email confirmation link.");
        }

        if (isActive) {
          setStatus("success");
          setMessage("Email confirmed successfully. Your account is ready.");
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      } catch (error) {
        if (isActive) {
          setStatus("error");
          setMessage(error?.message || "We could not confirm your email.");
        }
      }
    }

    verifyEmail();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_12px_32px_-4px_rgba(25,28,29,0.06)] p-8 text-center">
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
            status === "error" ? "bg-error-container text-error" : "bg-primary-fixed text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {status === "error" ? "error" : status === "success" ? "verified" : "hourglass_top"}
          </span>
        </div>
        <h1 className="text-3xl font-headline font-bold mb-3">
          {status === "success" ? "Email confirmed" : status === "error" ? "Confirmation failed" : "Confirming email"}
        </h1>
        <p className="text-on-surface-variant mb-8">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link className="bg-signature-gradient text-white px-6 py-3 rounded-full font-bold" to="/login">
            Continue to Login
          </Link>
          <Link className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-bold" to="/">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}