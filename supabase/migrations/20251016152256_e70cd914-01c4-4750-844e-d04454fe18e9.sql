-- Add multilingual description columns to monuments table
ALTER TABLE public.monuments 
ADD COLUMN description_english text,
ADD COLUMN description_hindi text,
ADD COLUMN description_telugu text;

-- Migrate existing description to English if exists
UPDATE public.monuments 
SET description_english = description 
WHERE description IS NOT NULL AND description_english IS NULL;

-- Add historical info for all languages
ALTER TABLE public.monuments
ADD COLUMN historical_info_english text,
ADD COLUMN historical_info_hindi text,
ADD COLUMN historical_info_telugu text;

-- Migrate existing historical info to English
UPDATE public.monuments
SET historical_info_english = historical_info
WHERE historical_info IS NOT NULL AND historical_info_english IS NULL;

-- Update recommendations table to allow admin management
ALTER TABLE public.recommendations
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Add RLS policies for admin to manage recommendations
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