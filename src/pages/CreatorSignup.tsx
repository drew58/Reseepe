import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronRight, Upload } from "lucide-react";
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

const CreatorSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = basic, 2 = creator details
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    chefName: "",
    specialty: "",
    bio: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    if (!formData.chefName || !formData.specialty) {
      toast.error("Chef name and specialty cuisine are required");
      return;
    }

    setLoading(true);
    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // The auth trigger creates the matching profile and assigns the creator role.
      // Profile fields can be completed after email verification.
      toast.success("Creator account created! Please verify your email, then complete your profile.");
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to create creator account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-20">
      <div className="max-w-md w-full">
        {/* Step 1 - Basic Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                Become a Creator
              </h1>
              <p className="text-sm text-muted-foreground">
                Share your culinary skills with the world
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="w-full py-3 rounded-2xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
            >
              Sign in instead
            </button>
          </motion.div>
        )}

        {/* Step 2 - Creator Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                Your Chef Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Tell us about yourself
              </p>
            </div>

            {/* Profile Image Upload */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-secondary overflow-hidden mb-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="text-sm font-semibold text-primary hover:underline">
                  Upload photo
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Chef Name
                </label>
                <input
                  type="text"
                  name="chefName"
                  value={formData.chefName}
                  onChange={handleInputChange}
                  placeholder="Your chef name"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Specialty Cuisine
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, specialty: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select your specialty</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write a short bio about yourself..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreatorSignup;
