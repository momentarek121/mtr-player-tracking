"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export function useCoachAuth() {
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<any>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let settled = false;

    const checkAccess = async (user: any) => {
      if (settled || !user) return;
      settled = true;

      const { data: existing } = await supabase
        .from("coaches")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (!existing) {
        setDenied(true);
        setLoading(false);
        return;
      }

      // Link this auth account to the coach record on first successful login
      if (!existing.auth_user_id) {
        await supabase.from("coaches").update({ auth_user_id: user.id }).eq("id", existing.id);
      }

      setCoach(existing);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) checkAccess(session.user);
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        checkAccess(session.user);
      } else {
        setTimeout(async () => {
          if (settled) return;
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2?.user) {
            checkAccess(s2.user);
          } else {
            settled = true;
            window.location.href = "/admin-login";
          }
        }, 1200);
      }
    })();

    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return { loading, coach, denied };
}
