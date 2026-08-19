import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "creator">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!isLogin && !displayName) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          localStorage.setItem("reseepe_onboarded", "true");
          navigate("/home", { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, displayName, role);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Check your email to verify your account!");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) toast.error("Google sign-in failed: " + error.message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-14 pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-gradient">
            <span className="text-primary">R</span>
            <span className="text-primary">E</span>
            <span className="text-green-500">S</span>
            <span className="text-green-500">E</span>
            <span className="text-green-500">E</span>
            <span className="text-primary">P</span>
            <span className="text-primary">E</span>
            </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLogin ? "Welcome back! Sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        {!isLogin && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setRole("user")}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                role === "user" ? "border-primary bg-light-orange" : "border-border bg-card"
              }`}
            >
              <User className={`w-6 h-6 ${role === "user" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${role === "user" ? "text-primary" : "text-foreground"}`}>
                I'm a User
              </span>
            </button>
            <button
              onClick={() => setRole("creator")}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                role === "creator" ? "border-primary bg-light-orange" : "border-border bg-card"
              }`}
            >
              <ChefHat className={`w-6 h-6 ${role === "creator" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${role === "creator" ? "text-primary" : "text-foreground"}`}>
                Food Creator
              </span>
            </button>
          </div>
        )}

        <div className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-12"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isLogin && (
          <button className="text-primary text-sm font-medium mt-3 block ml-auto">Forgot password?</button>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLogin ? "Sign In" : "Create Account"}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-xs">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.27 9.76A7.5 7.5 0 0 1 12 4.5c1.77 0 3.37.61 4.63 1.63l3.45-3.45A12.5 12.5 0 0 0 12 0 12 12 0 0 0 1.24 6.65l4.03 3.11Z"/>
              <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.5a7.5 7.5 0 0 1-6.73-4.24l-4.03 3.11A12 12 0 0 0 12 24a11.5 11.5 0 0 0 7.84-3l-3.8-2.99Z"/>
              <path fill="#4A90D9" d="M19.84 21a11.7 11.7 0 0 0 3.66-8.5c0-.83-.08-1.64-.24-2.5H12v5h4.34a5.2 5.2 0 0 1-2.3 2.99l3.8 3.01Z"/>
              <path fill="#FBBC05" d="M5.27 15.26A7.5 7.5 0 0 1 4.5 12c0-1.14.27-2.21.77-3.24L1.24 5.65A12 12 0 0 0 0 12c0 2.17.56 4.22 1.57 6l3.7-2.74Z"/>
            </svg>
            Google
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;