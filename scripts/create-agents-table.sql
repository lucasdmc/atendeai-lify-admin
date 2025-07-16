-- Criar tabela agents se não existir
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a todos os usuários autenticados
DROP POLICY IF EXISTS "Users can view all agents" ON public.agents;
CREATE POLICY "Users can view all agents" ON public.agents
  FOR SELECT USING (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Users can insert agents" ON public.agents;
CREATE POLICY "Users can insert agents" ON public.agents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Users can update agents" ON public.agents;
CREATE POLICY "Users can update agents" ON public.agents
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Inserir agente padrão se não existir
INSERT INTO public.agents (id, name, description, whatsapp_number, is_active)
VALUES (
  'default-agent',
  'Agente Padrão',
  'Agente WhatsApp padrão do sistema',
  '5511999999999',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  whatsapp_number = EXCLUDED.whatsapp_number,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verificar se foi criado
SELECT * FROM public.agents; 