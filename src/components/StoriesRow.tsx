import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import StoryViewer from "./StoryViewer";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  creator_name?: string;
  creator_avatar?: string;
}

const StoriesRow = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Fetch stories that haven't expired yet
        const { data, error } = await supabase
          .from("stories")
          .select("*")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // Hydrate with creator info
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((s) => s.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);

          const profileMap = new Map(
            (profiles || []).map((p) => [p.user_id, p])
          );

          const hydrated = data.map((s) => ({
            ...s,
            creator_name: profileMap.get(s.user_id)?.display_name || "Chef",
            creator_avatar: profileMap.get(s.user_id)?.avatar_url || null,
          }));

          setStories(hydrated);
        }
      } catch (error) {
        console.error("Failed to load stories:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStoryDelete = (storyId: string) => {
    setStories(stories.filter((s) => s.id !== storyId));
  };

  if (loading || stories.length === 0) {
    return null; // Hide the stories row if no stories exist
  }

  return (
    <>
      <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide px-4 -mx-4">
        {stories.map((story, i) => (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedStory(story)}
            className="flex-shrink-0 w-16 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 relative group active:scale-[0.95] transition-transform"
          >
            <img
              src={story.media_url}
              alt={story.creator_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-[10px] font-semibold text-primary-foreground truncate">
                {story.creator_name}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Story viewer modal */}
      <StoryViewer
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        onDelete={handleStoryDelete}
      />
    </>
  );
};

export default StoriesRow;