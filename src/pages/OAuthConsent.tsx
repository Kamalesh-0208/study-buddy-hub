import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import skillmavLogo from "@/assets/skillmav-logo.png";

type AuthClient = {
  auth: {
    oauth: {
      getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
      approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
      denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
    };
  };
};

const oauth = () => (supabase as unknown as AuthClient).auth.oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-bg)" }}>
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 space-y-5">
        <div className="flex items-center justify-center gap-3">
          <img src={skillmavLogo} alt="SkillMav logo" className="h-10 w-10 rounded-xl object-cover shadow-glow" />
          <span className="text-2xl font-extrabold gradient-text tracking-tight">SkillMav</span>
        </div>

        {error ? (
          <p className="text-sm text-destructive text-center">Could not load this authorization request: {error}</p>
        ) : !details ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="icon-bg h-10 w-10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground">
                Connect {details.client?.name ?? "an app"} to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                This lets {details.client?.name ?? "the client"} read and manage your study data as you.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-11" disabled={busy} onClick={() => decide(false)}>
                Deny
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl gradient-bg text-primary-foreground border-0 shadow-glow hover:opacity-90 font-semibold"
                disabled={busy}
                onClick={() => decide(true)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default OAuthConsent;
