
-- Create table to store Google Calendar tokens for users
CREATE TABLE public.google_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store calendar events cache
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  google_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_event_id)
);

-- Add RLS policies for google_calendar_tokens
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Google Calendar tokens" 
  ON public.google_calendar_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Calendar tokens" 
  ON public.google_calendar_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Calendar tokens" 
  ON public.google_calendar_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Calendar tokens" 
  ON public.google_calendar_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events" 
  ON public.calendar_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" 
  ON public.calendar_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" 
  ON public.calendar_events 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" 
  ON public.calendar_events 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_google_event_id ON public.calendar_events(google_event_id);
