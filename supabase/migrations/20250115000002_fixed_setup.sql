-- Fixed database setup for Smart Tourism Guide Application
-- This migration sets up all tables and includes the model_url column

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monuments table with model_url column
CREATE TABLE IF NOT EXISTS public.monuments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  historical_info TEXT,
  location TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  model_url TEXT, -- 3D model URL (e.g., Sketchfab embed URL)
  audio_telugu_url TEXT,
  audio_hindi_url TEXT,
  audio_english_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monument_images table for user uploads
CREATE TABLE IF NOT EXISTS public.monument_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id UUID REFERENCES public.monuments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id UUID REFERENCES public.monuments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nearby_place', 'hotel')),
  name TEXT NOT NULL,
  description TEXT,
  distance TEXT,
  rating DECIMAL(2,1),
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  monument_id UUID REFERENCES public.monuments(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monument_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors if they don't exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Anyone can view monuments" ON public.monuments;
    DROP POLICY IF EXISTS "Authenticated users can insert monuments" ON public.monuments;
    DROP POLICY IF EXISTS "Users can update their own monuments" ON public.monuments;
    DROP POLICY IF EXISTS "Users can view all monument images" ON public.monument_images;
    DROP POLICY IF EXISTS "Users can upload monument images" ON public.monument_images;
    DROP POLICY IF EXISTS "Users can delete their own images" ON public.monument_images;
    DROP POLICY IF EXISTS "Anyone can view recommendations" ON public.recommendations;
    DROP POLICY IF EXISTS "Users can view all feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for monuments (public read, authenticated write)
CREATE POLICY "Anyone can view monuments"
  ON public.monuments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert monuments"
  ON public.monuments FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own monuments"
  ON public.monuments FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for monument_images
CREATE POLICY "Users can view all monument images"
  ON public.monument_images FOR SELECT
  USING (true);

CREATE POLICY "Users can upload monument images"
  ON public.monument_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON public.monument_images FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for recommendations (public read)
CREATE POLICY "Anyone can view recommendations"
  ON public.recommendations FOR SELECT
  USING (true);

-- RLS Policies for feedback
CREATE POLICY "Users can view all feedback"
  ON public.feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for monument images (ignore if already exists)
DO $$ 
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('monument-images', 'monument-images', true);
EXCEPTION
    WHEN unique_violation THEN
        -- Bucket already exists, ignore
        NULL;
END $$;

-- Drop existing storage policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view monument images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload monument images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Storage policies for monument images
CREATE POLICY "Anyone can view monument images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'monument-images');

CREATE POLICY "Authenticated users can upload monument images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'monument-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'monument-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'monument-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Insert sample monuments with 3D model URLs (only if they don't exist)
INSERT INTO public.monuments (name, description, historical_info, location, category, model_url) 
SELECT 'Taj Mahal', 'An ivory-white marble mausoleum on the right bank of the river Yamuna', 'Built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal. Construction began in 1632 and was completed in 1653.', 'Agra, Uttar Pradesh', 'Monument', null
WHERE NOT EXISTS (SELECT 1 FROM public.monuments WHERE name = 'Taj Mahal');

INSERT INTO public.monuments (name, description, historical_info, location, category, model_url) 
SELECT 'Charminar', 'A monument and mosque located in Hyderabad', 'Built in 1591 by Muhammad Quli Qutb Shah to commemorate the founding of Hyderabad and the end of a deadly plague.', 'Hyderabad, Telangana', 'Monument', 'https://sketchfab.com/models/bb880d064036496ca14ebac08a243af0/embed?autostart=1&internal=1&tracking=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_watermark=0'
WHERE NOT EXISTS (SELECT 1 FROM public.monuments WHERE name = 'Charminar');

INSERT INTO public.monuments (name, description, historical_info, location, category, model_url) 
SELECT 'Golconda Fort', 'A historic fort and ruined city', 'Originally known as Mankal, Golconda Fort was built by the Kakatiyas and later enhanced by the Qutb Shahi dynasty in the 16th century.', 'Hyderabad, Telangana', 'Fort', null
WHERE NOT EXISTS (SELECT 1 FROM public.monuments WHERE name = 'Golconda Fort');

INSERT INTO public.monuments (name, description, historical_info, location, category, model_url) 
SELECT 'Red Fort', 'A historic fort in the city of Delhi', 'Constructed in 1639 by the fifth Mughal Emperor Shah Jahan as the palace of his fortified capital Shahjahanabad.', 'Delhi', 'Fort', null
WHERE NOT EXISTS (SELECT 1 FROM public.monuments WHERE name = 'Red Fort');

INSERT INTO public.monuments (name, description, historical_info, location, category, model_url) 
SELECT 'Qutub Minar', 'A minaret and victory tower that forms part of the Qutb complex', 'Built in the early 13th century by Qutb ud-Din Aibak, the first ruler of the Delhi Sultanate.', 'Delhi', 'Monument', null
WHERE NOT EXISTS (SELECT 1 FROM public.monuments WHERE name = 'Qutub Minar');

-- Insert sample recommendations (only if they don't exist)
INSERT INTO public.recommendations (monument_id, type, name, description, distance, rating) 
SELECT (SELECT id FROM public.monuments WHERE name = 'Taj Mahal' LIMIT 1), 'nearby_place', 'Agra Fort', 'Historic fort and former Mughal residence', '2.5 km', 4.5
WHERE NOT EXISTS (SELECT 1 FROM public.recommendations WHERE name = 'Agra Fort');

INSERT INTO public.recommendations (monument_id, type, name, description, distance, rating) 
SELECT (SELECT id FROM public.monuments WHERE name = 'Taj Mahal' LIMIT 1), 'hotel', 'The Oberoi Amarvilas', 'Luxury hotel with Taj Mahal views', '600 m', 4.8
WHERE NOT EXISTS (SELECT 1 FROM public.recommendations WHERE name = 'The Oberoi Amarvilas');

INSERT INTO public.recommendations (monument_id, type, name, description, distance, rating) 
SELECT (SELECT id FROM public.monuments WHERE name = 'Charminar' LIMIT 1), 'nearby_place', 'Mecca Masjid', 'One of the largest mosques in India', '200 m', 4.3
WHERE NOT EXISTS (SELECT 1 FROM public.recommendations WHERE name = 'Mecca Masjid');

INSERT INTO public.recommendations (monument_id, type, name, description, distance, rating) 
SELECT (SELECT id FROM public.monuments WHERE name = 'Charminar' LIMIT 1), 'hotel', 'Taj Falaknuma Palace', 'Historic palace hotel', '5 km', 4.7
WHERE NOT EXISTS (SELECT 1 FROM public.recommendations WHERE name = 'Taj Falaknuma Palace');

INSERT INTO public.recommendations (monument_id, type, name, description, distance, rating) 
SELECT (SELECT id FROM public.monuments WHERE name = 'Golconda Fort' LIMIT 1), 'nearby_place', 'Qutb Shahi Tombs', 'Historic royal tombs', '1 km', 4.4
WHERE NOT EXISTS (SELECT 1 FROM public.recommendations WHERE name = 'Qutb Shahi Tombs');

INSERT INTO public.recommendations (monument_id, type, name, description, distance, rating) 
SELECT (SELECT id FROM public.monuments WHERE name = 'Golconda Fort' LIMIT 1), 'hotel', 'ITC Kohenur', 'Luxury business hotel', '8 km', 4.6
WHERE NOT EXISTS (SELECT 1 FROM public.recommendations WHERE name = 'ITC Kohenur');

-- Add comment to describe the model_url column
COMMENT ON COLUMN public.monuments.model_url IS 'URL to the 3D model (e.g., Sketchfab embed URL)';
