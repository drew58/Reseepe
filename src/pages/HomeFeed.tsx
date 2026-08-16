import { Search, MessageSquare, Heart, Bookmark, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import StoriesRow from "@/components/StoriesRow";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoFullScreenModal from "@/components/VideoFullScreenModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getFeedCache, setFeedCache } from "@/lib/feedCache";
import { toast } from "sonner";

type Recipe = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  like_count: number;
  comment_count: number;
  creator_id: string;
  creator?: { display_name: string | null; username: string | null; avatar_url: string | null };
  verified?: boolean;
};

const FeedVideo = ({ src, poster, title, onFullscreen }: { src: string; poster?: string; title: string; onFullscreen?: () => void }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: [0.5] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full group cursor-pointer" onClick={onFullscreen}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={(e) => {
          e.stopPropagation();
          setMuted(!muted);
        }}
        className="w-full h-full object-cover"
        aria-label={title}
      />
      {/* Fullscreen hint */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-foreground/5">
        <span className="text-xs text-primary-foreground/70 font-medium">Tap for fullscreen</span>
      </div>
    </div>
  );
};

const HomeFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>(() => getFeedCache<Recipe>());
  const [loading, setLoading] = useState(() => getFeedCache<Recipe>().length === 0);
  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      const rows = (data || []) as any[];
      const cIds = Array.from(new Set(rows.map((r) => r.creator_id)));

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,display_name,username,avatar_url")
        .in("user_id", cIds.length ? cIds : ["00000000-0000-0000-0000-000000000000"]);

      const { data: fcs } = await supabase.from("featured_creators" as any).select("username,verified");

      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      const fcMap = new Map((fcs as any[] || []).map((f: any) => [f.username, f]));

      const enriched = rows.map((r) => {
        const p = profMap.get(r.creator_id);
        const fc = p?.username ? fcMap.get(p.username) : null;
        return { ...r, creator: p, verified: !!fc?.verified };
      });

      setRecipes(enriched);
      setFeedCache(enriched);
      setLoading(false);
    })();
  }, []);

  // Load likes & saves
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from("likes").select("recipe_id").eq("user_id", user.id),
        supabase.from("saves").select("recipe_id").eq("user_id", user.id),
      ]);
      setLikedRecipes(new Set((likes || []).map((l) => l.recipe_id)));
      setSavedRecipes(new Set((saves || []).map((s) => s.recipe_id)));
    })();
  }, [user]);

  const toggleLike = async (id: string, isLiked: boolean) => {
    if (!user) return navigate("/auth");

    const next = !isLiked;
    const newLiked = new Set(likedRecipes);
    if (next) newLiked.add(id);
    else newLiked.delete(id);
    setLikedRecipes(newLiked);

    if (next) {
      await supabase.from("likes").insert({ user_id: user.id, recipe_id: id });
    } else {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("recipe_id", id);
    }
  };

  const toggleSave = async (id: string, isSaved: boolean) => {
    if (!user) return navigate("/auth");

    const next = !isSaved;
    const newSaved = new Set(savedRecipes);
    if (next) newSaved.add(id);
    else newSaved.delete(id);
    setSavedRecipes(newSaved);

    if (next) {
      await supabase.from("saves").insert({ user_id: user.id, recipe_id: id });
    } else {
      await supabase.from("saves").delete().eq("user_id", user.id).eq("recipe_id", id);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - minimal */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-primary">RESEEPE</h1>
          <div className="flex gap-1">
            <button className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors" onClick={() => navigate("/messages")}>
              <MessageSquare className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors" onClick={() => navigate("/search")}>
              <Search className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Stories */}
      <div className="py-3 border-b border-border/30">
        <StoriesRow />
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {recipes.map((r, idx) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="border-b border-border/30"
          >
            {/* Recipe Card */}
            <div className="aspect-[9/14] bg-secondary relative group overflow-hidden">
              {/* Media */}
              {r.video_url ? (
                <FeedVideo src={r.video_url} poster={r.thumbnail_url || undefined} title={r.title} onFullscreen={() => { setFullscreenVideo(r.video_url); setFullscreenTitle(r.title); }} />
              ) : r.thumbnail_url ? (
                <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover cursor-pointer" onClick={() => navigate(`/recipe/${r.id}`)} />
              ) : (
                <div className="w-full h-full bg-secondary" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent pointer-events-none" />

              {/* Creator info - top */}
              {r.creator?.avatar_url && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/creator/${r.creator?.username}`)}>
                  <img src={r.creator.avatar_url} alt={r.creator.display_name} className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/60" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-primary-foreground">{r.creator.display_name}</span>
                    {r.verified && <VerifiedBadge size="sm" />}
                  </div>
                </div>
              )}

              {/* Title & stats - bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h2 className="text-lg font-bold text-primary-foreground mb-2 line-clamp-2">{r.title}</h2>
                <div className="flex items-center gap-3 text-sm text-primary-foreground/90">
                  <span className="flex items-center gap-1">❤️ {r.like_count}</span>
                  <span className="flex items-center gap-1">💬 {r.comment_count}</span>
                </div>
              </div>

              {/* Action buttons - right side (on hover) */}
              <div className="absolute right-3 bottom-20 z-20 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleLike(r.id, likedRecipes.has(r.id))}
                  className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/40 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${likedRecipes.has(r.id) ? "fill-red-500 text-red-500" : "text-primary-foreground"}`} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/recipe/${r.id}`)}
                  className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/40 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSave(r.id, savedRecipes.has(r.id))}
                  className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/40 transition-colors"
                >
                  <Bookmark className={`w-5 h-5 ${savedRecipes.has(r.id) ? "fill-primary text-primary" : "text-primary-foreground"}`} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/40 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-primary-foreground" />
                </motion.button>
              </div>

              {/* Tap to view hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-sm text-primary-foreground/70 font-medium">Tap to view recipe</span>
              </div>
            </div>
          </motion.div>
        ))}

        {!loading && recipes.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No recipes yet. Start following creators!</p>
          </div>
        )}
      </div>

      {/* Fullscreen video modal */}
      <VideoFullScreenModal
        src={fullscreenVideo}
        title={fullscreenTitle}
        onClose={() => setFullscreenVideo(null)}
      />
    </div>
  );
};

export default HomeFeed;