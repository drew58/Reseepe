import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
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

// Sample food carousel data
const foodItems = [
  {
    id: 1,
    title: "Discover what to cook instantly",
    subtitle: "Scroll through delicious short videos and find your next meal in seconds",
    image: "url('food-1.jpg')",
  },
  {
    id: 2,
    title: "Recipes from food creators",
    subtitle: "Learn from real chefs and home cooks around the world",
    image: "url('food-2.jpg')",
  },
  {
    id: 3,
    title: "Cook with what you have",
    subtitle: "Search recipes based on ingredients in your kitchen",
    image: "url('food-3.jpg')",
  },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = carousel, 1 = cuisines, 2 = continent
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedContinent, setSelectedContinent] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleNextFood = () => {
    setCurrentFoodIndex((prev) => (prev + 1) % foodItems.length);
  };

  const handlePrevFood = () => {
    setCurrentFoodIndex((prev) =>
      prev === 0 ? foodItems.length - 1 : prev - 1
    );
  };

  const handleSkipCarousel = () => {
    setStep(1); // Go to cuisines
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

    setLoading(true);
    try {
      // Set localStorage flag so user doesn't see onboarding again
      localStorage.setItem("reseepe_onboarded", "true");

      // Save preferences if user is logged in
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            favorite_cuisines: selectedCuisines,
            continent: selectedContinent,
            onboarded: true,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      }

      toast.success("Let's get cooking!");
      // Redirect to Auth (or home if already logged in)
      navigate(user ? "/home" : "/auth", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-20">
      <div className="max-w-md w-full">
        {/* Step 0 - Food Carousel Welcome */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="relative w-full h-96 rounded-3xl overflow-hidden bg-secondary"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3)), ${foodItems[currentFoodIndex].image}`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors cursor-pointer">
                  <ChevronRight className="w-8 h-8 text-foreground ml-1" />
                </div>
              </div>

              {/* Skip button */}
              <button
                onClick={handleSkipCarousel}
                className="absolute top-4 right-4 text-white font-semibold text-sm bg-black/40 px-3 py-1 rounded-full hover:bg-black/60 transition-colors"
              >
                Skip
              </button>

              {/* Carousel indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {foodItems.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === currentFoodIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center">
              <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                {foodItems[currentFoodIndex].title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {foodItems[currentFoodIndex].subtitle}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePrevFood}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextFood}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Continue to Cuisines */}
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-2xl bg-foreground text-background font-semibold flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 1 - Cuisines */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                Welcome to <span className="text-primary">R</span>
                <span className="text-primary">E</span>
                <span className="text-green-500">S</span>
                <span className="text-green-500">E</span>
                <span className="text-green-500">E</span>
                <span className="text-primary">P</span>
                <span className="text-primary">E</span>
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