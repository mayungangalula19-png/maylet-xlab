-- Add admin and super_admin to the user_role enum type if they don't already exist
-- This migration safely adds missing enum values

-- First, let's create a new enum type with all required values
CREATE TYPE public.user_role_new AS ENUM (
  'user', 'innovator', 'mentor', 'investor', 'admin', 'super_admin'
);

-- Alter the profiles table to temporarily use TEXT
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;

-- Drop the old enum type
DROP TYPE public.user_role;

-- Rename the new enum type to the original name
ALTER TYPE public.user_role_new RENAME TO user_role;

-- Alter the profiles table back to use the enum type
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

-- Verify the enum has all values
SELECT unnest(enum_range(NULL::public.user_role));
