-- Create Dogs table
CREATE TABLE public.dogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dogs" ON public.dogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dogs" ON public.dogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dogs" ON public.dogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dogs" ON public.dogs FOR DELETE USING (auth.uid() = user_id);

-- Create Walks table
CREATE TABLE public.walks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  bathroom_break BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own walks" ON public.walks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own walks" ON public.walks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own walks" ON public.walks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own walks" ON public.walks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_walks_dog_id ON public.walks(dog_id);
CREATE INDEX idx_walks_user_id ON public.walks(user_id);
CREATE INDEX idx_walks_date ON public.walks(date);
CREATE INDEX idx_dogs_user_id ON public.dogs(user_id);