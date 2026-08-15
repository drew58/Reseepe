import { Search, Crown, Lock, MessageSquare, Play, Volume2, VolumeX, BookOpen, MoreVertical, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import StoriesRow from "@/components/StoriesRow";
import VerifiedBadge from "@/components/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getFeedCache, setFeedCache } from "@/lib/feedCache";
import { toast } from "sonner";

type Recipe = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  cook_time: string | null;
  cost_estimate: string | null;
  like_count: number;
  comment_count: number;
  creator_id: string;
  tags: string[] | null;
  creator?: { display_name: string | null; username: string | null; avatar_url: string | null };
  verified?: boolean;
  country?: string | null;
};

const FeedVideo = ({ src, poster, title }: { src: string; poster?: string; title: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0.5;
        setInView(visible);
        if (visible && !paused) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: [0, 0.5, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [paused]);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    if (muted) {
      setMuted(false);
      el.muted = false;
      el.play().catch(() => {});
      return;
    }
    if (el.paused) {
      setPaused(false);
      el.play().catch(() => {});
    } else {
      setPaused(true);
      el.pause();
    }
  };

  return (
    <div className="relative w-full h-full" onClick={handleTap}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label={title}
        className="w-full h-full object-cover"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMuted((m) => {
            const nm = !m;
            if (ref.current) ref.current.muted = nm;
            return nm;
          });
        }}
        className="absolute bottom-3 right-3 z-30 w-9 h-9 rounded-full bg-foreground/40 backdrop-blur-md flex items-center justify-center"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="w-4 h-4 text-primary-foreground" /> : <Volume2 className="w-4 h-4 text-primary-foreground" />}
      </button>
      {paused && inView && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-foreground/40 backdrop-blur-md flex items-center justify-center">
            <Play className="w-7 h-7 text-primary-foreground fill-current ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

const HomeFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>(() => getFeedCache<Recipe>());
  const [loading, setLoading] = useState(() => getFeedCache<Recipe>().length === 0);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      const rows = (data || []) as any[];
      const cIds = Array.from(new Set(rows.map((r) => r.creator_id)));
      const [{ data: profs }, { data: fcs }] = await Promise.all([
        supabase.from("profiles").select("user_id,display_name,username,avatar_url").in("user_id", cIds.length ? cIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("featured_creators" as any).select("username,verified,country"),
      ]);
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      const fcMap = new Map(
        (fcs as any[] || []).map((f: any) => [f.username, f])
      );
      const enriched = rows.map((r) => {
        const p = profMap.get(r.creator_id);
        const fc = p?.username ? fcMap.get(p.username) : null;
        return { ...r, creator: p, verified: !!fc?.verified, country: fc?.country || null };
      });
      setRecipes(enriched);
      setFeedCache(enriched);
      setLoading(false);
    })();
  }, []);

  const handleDeleteRecipe = async (recipeId: string, creatorId: string) => {
    if (!user || user.id !== creatorId) {
      toast.error("You can only delete your own recipes");
      return;
    }

    setDeleting(recipeId);
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
      if (error) throw error;
      toast.success("Recipe deleted");
      setRecipes(recipes.filter((r) => r.id !== recipeId));
      setMenuOpen(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete recipe");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-4 pt-12 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold font-display">
            <span className="text-primary">R</span>
            <span className="text-primary">E</span>
            <span className="text-primary">S</span>
            <span className="text-[hsl(142,50%,45%)]">E</span>
            <span className="text-[hsl(142,50%,45%)]">E</span>
            <span className="text-primary">P</span>
            <span className="text-primary">E</span>
          </h1>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center" onClick={() => navigate("/messages")}>
              <MessageSquare className="w-4 h-4 text-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center" onClick={() => navigate("/search")}>
              <Search className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <StoriesRow />

      <div className="px-4 space-y-4 mt-4">
        {loading && <div className="text-center py-10 text-sm text-muted-foreground">Loading...</div>}

        {recipes.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full aspect-[9/14] rounded-3xl overflow-hidden group"
          >
            {r.video_url ? (
              <FeedVideo src={r.video_url} poster={r.thumbnail_url || undefined} title={r.title} />
            ) : r.thumbnail_url ? (
              <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent pointer-events-none" />
            
            {/* Tags */}
            {r.tags && r.tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 pointer-events-none">
                {r.tags.slice(0, 2).map((t) => (
                  <span key={t} className="tag-badge bg-card/80 text-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Creator avatar */}
            {r.creator?.avatar_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/creator/${r.creator?.username}`);
                }}
                className="absolute top-4 right-12 z-20"
              >
                <div className="relative">
                  <img src={r.creator.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/80 shadow-lg" />
                  {r.verified && <div className="absolute -bottom-0.5 -right-0.5"><VerifiedBadge size="sm" /></div>}
                </div>
              </button>
            )}

            {/* 3-dot menu button (only on click) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(menuOpen === r.id ? null : r.id);
              }}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/50 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-primary-foreground" />
            </button>

            {/* Delete menu dropdown */}
            {menuOpen === r.id && (
              <div
                className="absolute top-14 right-4 z-30 bg-card border border-border rounded-xl overflow-hidden shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleDeleteRecipe(r.id, r.creator_id)}
                  disabled={deleting === r.id}
                  className="w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 text-left font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting === r.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  Delete Recipe
                </button>
              </div>
            )}

            {/* Recipe info */}
            <div className="absolute bottom-4 left-4 right-16 z-10 pointer-events-none">
              <h3 className="text-primary-foreground font-bold text-lg leading-tight line-clamp-2">{r.title}</h3>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-primary-foreground/80 text-sm">@{r.creator?.username}</p>
                {r.verified && <VerifiedBadge size="sm" />}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-primary-foreground/80">
                {r.cook_time && <span>⏱ {r.cook_time}</span>}
                {r.cost_estimate && <span>💰 {r.cost_estimate}</span>}
                <span>♥ {r.like_count}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/recipe/${r.id}`);
                }}
                className="pointer-events-auto mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              >
                <BookOpen className="w-3.5 h-3.5" /> View Recipe
              </button>
            </div>
          </motion.div>
        ))}

        {!loading && recipes.length === 0 && (
          <div className="text-center py-16">
            <Lock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recipes yet</p>
          </div>
        )}

        <div className="text-center py-8">
          <button
            onClick={() => navigate("/subscriptions")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25"
          >
            <Crown className="w-4 h-4" /> View Plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeFeed;