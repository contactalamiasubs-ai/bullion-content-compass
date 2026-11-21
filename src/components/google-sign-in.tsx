import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { useShoppingText } from "@/components/shopping-provider";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { rememberLogin, type LoginDestination } from "@/lib/login";

export function GoogleSignIn({ destination = "/account", remember = true }: { destination?: LoginDestination; remember?: boolean }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const text = useShoppingText();
  return <Button disabled={busy} className="google-sign-in" onClick={async () => {
    setBusy(true);
    try {
      rememberLogin(remember);
      sessionStorage.setItem("gold-center-login-destination", destination);
      const redirect = `${window.location.origin}/auth/callback`;
      const host = window.location.hostname;
      const lovableHosted = host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com") || host === "localhost";
      if (!lovableHosted) {
        // External hosting (e.g. Hostinger) has no /~oauth broker path, so sign in directly.
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect, queryParams: { prompt: "select_account" } } });
        if (error) toast.error(text("auth_error"));
        return;
      }
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirect, extraParams: { prompt: "select_account" } });
      if (result.error) { toast.error(text("auth_error")); return; }
      if (result.redirected) return;
      const verified = await supabase.auth.getUser();
      if (!verified.data.user || verified.error) { toast.error(text("auth_error")); return; }
      sessionStorage.removeItem("gold-center-login-destination");
      await nav({ to: destination, replace: true });
    } catch { toast.error(text("sync_error")); }
    finally { setBusy(false); }
  }}>
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px] shrink-0"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
    {text("google")}
  </Button>;
}