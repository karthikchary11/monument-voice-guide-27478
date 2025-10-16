-- Add role column to profiles (admin/user)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin','user')) DEFAULT 'user';
