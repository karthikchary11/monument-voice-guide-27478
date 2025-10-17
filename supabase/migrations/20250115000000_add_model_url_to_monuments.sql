-- Add model_url column to monuments table
ALTER TABLE public.monuments 
ADD COLUMN model_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.monuments.model_url IS 'URL to the 3D model (e.g., Sketchfab embed URL)';

-- Update existing monuments with their 3D model URLs
UPDATE public.monuments 
SET model_url = 'https://sketchfab.com/models/bb880d064036496ca14ebac08a243af0/embed?autostart=1&internal=1&tracking=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_watermark=0'
WHERE name = 'Charminar';

-- You can add more model URLs for other monuments here
-- UPDATE public.monuments 
-- SET model_url = 'https://sketchfab.com/models/[model-id]/embed?autostart=1&internal=1&tracking=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_watermark=0'
-- WHERE name = 'Taj Mahal';
