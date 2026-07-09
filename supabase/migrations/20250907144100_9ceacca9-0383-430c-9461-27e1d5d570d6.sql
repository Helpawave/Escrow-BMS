-- Create service usage history table
CREATE TABLE public.service_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  usage_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usage_duration INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for service usage
CREATE POLICY "Users can view their own usage history" 
ON public.service_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage records" 
ON public.service_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all usage history" 
ON public.service_usage 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_service_usage_user_date ON public.service_usage(user_id, usage_date DESC);
CREATE INDEX idx_service_usage_service ON public.service_usage(service_id);