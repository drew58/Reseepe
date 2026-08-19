import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Clock, Users } from "lucide-react";

const foodSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=700&fit=crop",
    category: "Quick Bites",
    title: "Discover Quick & Delicious Recipes",
    desc: "Watch short videos of mouthwatering recipes you can make in minutes. From snacks to full meals.",
    badge: "⚡ Fast & Easy",
    stats: ["5-20 min", "Beginner friendly"],
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=700&fit=crop",
    category: "Comfort Food",
    title: "Cozy Comfort Meals",
    desc: "Warm your soul with classic comfort dishes. From family recipes to trending favorites that bring people together.",
    badge: "❤️ Feel Good Food",
    stats: ["30-60 min", "Perfect for family"],
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=700&fit=crop",
    category: "Healthy Living",
    title: "Nutritious & Tasty",
    desc: "Eat healthy without sacrificing flavor. Explore balanced recipes packed with nutrients and fresh ingredients.",
    badge: "🥗 Wellness First",
    stats: ["20-40 min", "Nutrition focused"],
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=700&fit=crop",
    category: "Global Cuisines",
    title: "Taste the World",
    desc: "Travel through flavors from Africa, Asia, Europe, Americas & more. Learn authentic recipes from creators worldwide.",
    badge: "🌍 Cultural Flavors",
    stats: ["Varies", "World recipes"],
  },
];

const FoodCarousel = ({ onComplete }: { onComplete: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % foodSlides.length);
    }, 6000);
    return () => clearTimeout(timer);
  }, [current, autoPlay]);

  const handleNext = () => {
    if (current === foodSlides.length - 1) {
      onComplete();
    } else {
      setCurrent((prev) => prev + 1);
      setAutoPlay(false);
    }
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + foodSlides.length) % foodSlides.length);
    setAutoPlay(false);
  };

  const handleDotClick = (idx: number) => {
    setCurrent(idx);
    setAutoPlay(false);
  };

  const slide = foodSlides[current];

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top section with image */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-secondary to-background pt-8">
        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-6 right-6 text-foreground text-sm font-semibold hover:opacity-70 transition-opacity z-10"
        >
          Skip
        </button>

        {/* Food Image Carousel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="relative w-64 h-96 rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                <div className="w-0 h-0 border-l-6 border-l-primary border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
              </div>
            </div>

            {/* Category badge */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {slide.category}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 z-10 w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/40 text-foreground flex items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 z-10 w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/40 text-foreground flex items-center justify-center transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom content section */}
      <div className="flex-1 flex flex-col px-6 py-8 justify-between">
        {/* Text content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Badge */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{slide.badge.split(" ")[0]}</span>
              <span className="text-sm font-semibold text-primary">
                {slide.badge.split(" ").slice(1).join(" ")}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              {slide.title}
            </h2>

            {/* Description */}
            <p className="text-base text-muted-foreground leading-relaxed">
              {slide.desc}
            </p>

            {/* Stats */}
            <div className="flex gap-4 pt-2">
              {slide.stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                  {idx === 0 && <Clock className="w-3 h-3" />}
                  {idx === 1 && <Users className="w-3 h-3" />}
                  <span>{stat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex gap-2 justify-center py-4">
          {foodSlides.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? "bg-primary w-8" : "bg-border w-2 hover:bg-border/60"
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>

        {/* Next button */}
        <motion.button
          onClick={handleNext}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {current === foodSlides.length - 1 ? "Continue to Setup" : "Next"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FoodCarousel;