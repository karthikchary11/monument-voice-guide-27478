-- Add multilingual description columns to monuments table
ALTER TABLE public.monuments 
ADD COLUMN IF NOT EXISTS description_english text,
ADD COLUMN IF NOT EXISTS description_hindi text,
ADD COLUMN IF NOT EXISTS description_telugu text,
ADD COLUMN IF NOT EXISTS historical_info_english text,
ADD COLUMN IF NOT EXISTS historical_info_hindi text,
ADD COLUMN IF NOT EXISTS historical_info_telugu text;

-- Migrate existing data to English columns
UPDATE public.monuments 
SET description_english = description,
    historical_info_english = historical_info
WHERE description_english IS NULL;

-- Add created_by column to recommendations if not exists
ALTER TABLE public.recommendations
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update RLS policies for recommendations to allow admin to manage them
DROP POLICY IF EXISTS "Authenticated users can insert recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.recommendations;

CREATE POLICY "Authenticated users can insert recommendations"
ON public.recommendations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own recommendations"
ON public.recommendations
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own recommendations"
ON public.recommendations
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);