ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_reel boolean NOT NULL DEFAULT false;
UPDATE public.recipes SET is_reel = true WHERE video_url IS NOT NULL AND is_reel = false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_cuisines text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS continent text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences_set boolean NOT NULL DEFAULT false;
CREATE POLICY "Creator profiles are publicly discoverable" ON public.profiles FOR SELECT TO anon USING (true);
GRANT SELECT ON public.profiles TO anon;