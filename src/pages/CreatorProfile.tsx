import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import VerifiedBadge from "@/components/VerifiedBadge";
import { isProfileComplete } from "@/lib/profile";

type Profile = { user_id: string; display_name: string | null; username: string | null; avatar_url: string | null; bio: string | null; specialty: string | null; country: string | null; role: string | null };
type FC = { display_name: string; country: string | null; verified: boolean; followers_seed: number; is_premium: boolean };
type Recipe = { id: string; title: string; thumbnail_url: string | null };

const CreatorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // username
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meta, setMeta] = useState<FC | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles").select("user_id,display_name,username,avatar_url,bio,specialty,country,role")
        .eq("username", id).maybeSingle();
      if (!prof) { setLoading(false); return; }
      setProfile(prof as Profile);

      const [{ data: fc }, { data: recs }] = await Promise.all([
        supabase.from("featured_creators" as any).select("display_name,country,verified,followers_seed,is_premium").eq("username", id).maybeSingle(),
        supabase.from("recipes").select("id,title,thumbnail_url").eq("creator_id", prof.user_id).order("created_at", { ascending: false }),
      ]);
      setMeta((fc as any) || null);
      setRecipes((recs as Recipe[]) || []);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user || !profile) return;
    const check = async () => {
      const { data } = await supabase.from("follows").select("id")
        .eq("follower_id", user.id).eq("following_id", profile.user_id).maybeSingle();
      setFollowing(!!data);
    };
    check();
    const ch = supabase.channel(`follow-${profile.user_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${user.id}` }, check)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, profile]);

  const toggle = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!profile) return;
    setBusy(true);
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.user_id);
      toast.success(`Unsubscribed from ${profile.display_name}`);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.user_id });
      toast.success(`Subscribed to ${profile.display_name}`);
    }
    setBusy(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">Creator not found.</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative h-40">
        {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover blur-sm scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-md flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl border-4 border-background overflow-hidden bg-secondary">
            {profile.avatar_url && <img src={profile.avatar_url} alt={profile.display_name || ""} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg text-foreground">{profile.display_name}</h1>
              {meta?.verified && <VerifiedBadge size="md" />}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username} {meta?.country && `· ${meta.country}`}</p>
          </div>
        </div>

        <div className="flex gap-6 mb-4">
          <div><span className="font-bold text-foreground">{meta ? (meta.followers_seed / 1000).toFixed(1) + "k" : "—"}</span> <span className="text-xs text-muted-foreground">Followers</span></div>
          <div><span className="font-bold text-foreground">{recipes.length}</span> <span className="text-xs text-muted-foreground">Recipes</span></div>
          <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /><span className="font-bold text-foreground">4.9</span></div>
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={toggle} disabled={busy} className={`flex-1 py-3 rounded-2xl font-semibold text-sm shadow-lg ${following ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground shadow-primary/25"}`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : following ? "Subscribed" : "Subscribe"}
          </button>
          <button onClick={() => navigate(profile?.user_id ? `/messages/${profile.user_id}` : "/messages")} className="px-5 py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm">Message</button>
        </div>

        {profile.bio && <p className="text-sm text-muted-foreground leading-relaxed mb-6">{profile.bio}</p>}

        <h3 className="font-bold text-foreground mb-3">Recipes</h3>
        {recipes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No recipes yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {recipes.map((v) => (
              <div key={v.id} className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform relative" onClick={() => navigate(`/recipe/${v.id}`)}>
                {v.thumbnail_url && <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-1.5">
                  <p className="text-[9px] font-semibold text-primary-foreground line-clamp-2">{v.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorProfile;
