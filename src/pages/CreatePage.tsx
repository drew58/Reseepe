import { Upload, Plus, X, Camera, Video, Loader2, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const tagOptions = ["Cheap", "Fast", "Healthy", "Comfort", "Spicy", "Vegan"];
const cookTimeNumbers = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const cookTimeUnits = ["min", "hour", "day"];

const CreatePage = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [costEstimate, setCostEstimate] = useState("");
  const [cookTimeNum, setCookTimeNum] = useState("30");
  const [cookTimeUnit, setCookTimeUnit] = useState("min");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user, isCreator, rolesLoading } = useAuth();
  const navigate = useNavigate();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File must be under 100MB");
      return;
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a recipe name");
      return;
    }

    setIsUploading(true);
    try {
      let mediaUrl = "";
      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(path, mediaFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      }
      const uploadedVideo = !!mediaFile?.type.startsWith("video/");

      // Format cook time as "30 min" or "2 hours"
      const cookTimeDisplay = cookTimeUnit === "hour" 
        ? `${cookTimeNum} hour${parseInt(cookTimeNum) > 1 ? "s" : ""}`
        : cookTimeUnit === "day"
        ? `${cookTimeNum} day${parseInt(cookTimeNum) > 1 ? "s" : ""}`
        : `${cookTimeNum} min`;

      const { error } = await supabase.from("recipes").insert({
        creator_id: user.id,
        title: title.trim(),
        video_url: uploadedVideo ? mediaUrl : null,
        thumbnail_url: !uploadedVideo ? mediaUrl || null : null,
        cost_estimate: costEstimate || null,
        cook_time: cookTimeDisplay,
        ingredients: ingredients.split("\n").filter(Boolean),
        steps: steps.split("\n").filter(Boolean),
        tags: selectedTags,
      });

      if (error) throw error;
      toast.success("Recipe published!");
      navigate("/home");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setIsUploading(false);
    }
  };

  const isVideo = mediaFile?.type.startsWith("video/");

  if (!rolesLoading && user && !isCreator) {
    return (
      <div className="min-h-screen bg-background pb-24 pt-12 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-light-orange flex items-center justify-center mb-4">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold font-display text-foreground mb-2">Creator-only feature</h1>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Posting recipes is reserved for verified Food Creators. Apply for a creator account to start sharing your dishes with the world.
        </p>
        <button
          onClick={() => navigate("/profile")}
          className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25"
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-12 px-4">
      <h1 className="text-xl font-bold font-display text-foreground mb-6">Upload Recipe</h1>

      {/* Hidden inputs for camera/file */}
      <input ref={fileInputRef} type="file" accept="video/*,image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      {/* Media preview or upload area */}
      {mediaPreview ? (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 bg-foreground/5">
          {isVideo ? (
            <video src={mediaPreview} className="w-full h-full object-cover" controls />
          ) : (
            <img src={mediaPreview} className="w-full h-full object-cover" alt="Preview" />
          )}
          <button
            onClick={() => {
              setMediaFile(null);
              setMediaPreview(null);
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-foreground/60 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4 text-background" />
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video rounded-2xl border-2 border-dashed border-primary/30 bg-light-orange flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Tap to upload or browse</p>
            <p className="text-xs text-muted-foreground">MP4, MOV, JPG up to 100MB</p>
          </div>
          {/* Camera buttons */}
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground active:scale-[0.98] transition-transform"
            >
              <Camera className="w-4 h-4 text-primary" />
              Take Photo
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground active:scale-[0.98] transition-transform"
            >
              <Video className="w-4 h-4 text-primary" />
              Record Video
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Recipe Name</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Smoky Jollof Rice"
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Est. Cost</label>
            <input
              value={costEstimate}
              onChange={(e) => setCostEstimate(e.target.value)}
              placeholder="$5"
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Cook Time</label>
            <div className="flex gap-2">
              <select
                value={cookTimeNum}
                onChange={(e) => setCookTimeNum(e.target.value)}
                className="flex-1 px-3 py-3.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {cookTimeNumbers.map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <select
                value={cookTimeUnit}
                onChange={(e) => setCookTimeUnit(e.target.value)}
                className="flex-1 px-3 py-3.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {cookTimeUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Ingredients</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            placeholder="List ingredients, one per line"
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Steps</label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={4}
            placeholder="Describe each step..."
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {selectedTags.includes(tag) && <X className="w-3 h-3 inline mr-1" />}
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full mt-4 bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isUploading ? "Publishing..." : "Publish Recipe"}
        </button>
      </div>
    </div>
  );
};

export default CreatePage;