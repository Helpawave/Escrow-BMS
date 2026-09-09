-- Add upi_qr_url column to profiles table for UPI payment QR code
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS upi_qr_url TEXT;
