import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

const cuisines = [
  "Italian",
  "Asian",
  "African",
  "Mexican",
  "Indian",
  "Mediterranean",
  "Middle Eastern",
  "American",
  "Caribbean",
  "European",
];

const continents = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedContinent, setSelectedContinent] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleContinueStep1 = () => {
    if (selectedCuisines.length === 0) {
      toast.error("Select at least one cuisine");
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!selectedContinent) {
      toast.error("Select your continent");
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      // Save preferences to profiles
      const { error } = await supabase
        .from("profiles")
        .update({
          favorite_cuisines: selectedCuisines,
          continent: selectedContinent,
          onboarded: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Preferences saved!");
      navigate("/home");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-20">
      <div className="max-w-md w-full">
        {/* Step 1 - Cuisines */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                Welcome to <span className="text-primary">RESEEPE</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Help us personalize your feed
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">
                What cuisines do you love?
              </h2>
              <div className="space-y-2">
                {cuisines.map((cuisine) => (
                  <motion.button
                    key={cuisine}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleCuisine(cuisine)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                      selectedCuisines.includes(cuisine)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cuisine}
                  </motion.button>
                ))}
              </div>
            </div>

            <button
              onClick={handleContinueStep1}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2 - Continent */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Where are you from?
              </h1>
              <p className="text-sm text-muted-foreground">
                So we can recommend local creators
              </p>
            </div>

            <div className="space-y-2">
              {continents.map((continent) => (
                <motion.button
                  key={continent}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedContinent(continent)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    selectedContinent === continent
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {continent}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? "Saving..." : "Get Started"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;