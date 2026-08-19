import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "user" | "creator" | "admin";

export type CreatorSignupExtras = {
  specialty?: string;
  country?: string;
  bio?: string;
  username?: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadRoles = useCallback(async (uid: string) => {
    setRolesLoading(true);
    const [{ data: roleRows }, { data: prof }] = await Promise.all([
      supabase.from("user_roles" as any).select("role").eq("user_id", uid),
      supabase.from("profiles").select("role").eq("user_id", uid).maybeSingle(),
    ]);
    setRoles(((roleRows as any[]) || []).map((r) => r.role as AppRole));
    setProfileRole(((prof as any)?.role as string) ?? null);
    setRolesLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setProfileRole(null);
      setRolesLoading(false);
      return;
    }
    loadRoles(user.id);
  }, [user, loadRoles]);

  const refreshRoles = useCallback(() => {
    if (user) loadRoles(user.id);
  }, [user, loadRoles]);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: "user" | "creator",
    extras?: CreatorSignupExtras
  ) => {
    const redirectUrl = `${window.location.origin}/home`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
          role,
          ...(extras?.specialty ? { specialty: extras.specialty } : {}),
          ...(extras?.country ? { country: extras.country } : {}),
          ...(extras?.bio ? { bio: extras.bio } : {}),
          ...(extras?.username ? { username: extras.username } : {}),
        },
      },
    });

    // If the session is live immediately (email confirmation off), make sure the
    // extra creator details land on the profile row too.
    if (!error && data.session?.user && extras) {
      const updates: Record<string, string> = {};
      if (extras.specialty) updates.specialty = extras.specialty;
      if (extras.country) updates.country = extras.country;
      if (extras.bio) updates.bio = extras.bio;
      if (extras.username) updates.username = extras.username;
      if (Object.keys(updates).length) {
        await supabase.from("profiles").update(updates as any).eq("user_id", data.session.user.id);
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  // Roles table is the source of truth, profiles.role is a fallback for
  // legacy accounts created before the roles table existed.
  const isCreator =
    roles.includes("creator") ||
    roles.includes("admin") ||
    profileRole === "creator" ||
    profileRole === "admin";

  return { user, session, loading, roles, profileRole, rolesLoading, isCreator, refreshRoles, signUp, signIn, signOut };
};
