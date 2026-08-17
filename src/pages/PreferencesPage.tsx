import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Wordmark from "@/components/Wordmark";

export const CUISINES = [
  "Nigerian", "Ghanaian", "Ethiopian", "Moroccan",
  "Italian", "French", "Spanish", "British",
  "Chinese", "Japanese", "Korean", "Indian", "Thai",
  "Mexican", "Brazilian", "Peruvian",
  "American BBQ", "Southern Soul", "Caribbean",
  "Lebanese", "Turkish", "Persian",
  "Vegan", "Desserts", "Street Food", "Seafood",
];

export const CONTINENTS = [
  "Africa", "Europe", "Asia", "North America", "South America", "Oceania", "Middle East",
];

const PreferencesPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [continent, setContinent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  const toggle = (c: string) =>
    setCuisines((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const save = async () => {
    if (!user) return;
    if (cuisines.length < 1) return toast.error("Pick at least one food you love");
    if (!continent) return toast.error("Pick your region");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ favorite_cuisines: cuisines, continent, preferences_set: true } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tastes saved — here are creators for you");
    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-32">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Wordmark className="text-2xl" />
        <h1 className="text-2xl font-bold font-display text-foreground mt-4">What do you love to eat?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick your favourites and we'll recommend creators cooking exactly that.
        </p>

        <h2 className="text-sm font-semibold text-foreground mt-7 mb-3">Foods & cuisines</h2>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => {
            const on = cuisines.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {on && <Check className="w-3 h-3 inline mr-1" />}
                {c}
              </button>
            );
          })}
        </div>

        <h2 className="text-sm font-semibold text-foreground mt-8 mb-3">Which region are you cooking from?</h2>
        <div className="grid grid-cols-2 gap-3">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => setContinent(c)}
              className={`py-3.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                continent === c ? "border-fresh bg-fresh/10 text-fresh" : "border-border bg-card text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="fixed bottom-0 inset-x-0 max-w-lg mx-auto p-5 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Show my creators
        </button>
        <button
          onClick={() => navigate("/home", { replace: true })}
          className="w-full text-xs text-muted-foreground mt-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default PreferencesPage;
