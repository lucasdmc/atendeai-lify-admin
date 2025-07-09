-- Migration para criar tabela contextualization_data
-- Execute: supabase db push --linked --include-all

-- Tabela para dados de contextualização da ESADI
CREATE TABLE IF NOT EXISTS public.contextualization_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir dados da ESADI
INSERT INTO public.contextualization_data (title, content, category, tags) VALUES
('Missão da ESADI', 'A ESADI - Escola Superior de Advocacia da OAB/DF tem como missão promover a excelência na formação e capacitação de advogados, contribuindo para o desenvolvimento da advocacia e da sociedade.', 'institucional', ARRAY['missão', 'formação', 'advocacia']),
('Visão da ESADI', 'Ser referência nacional em educação jurídica continuada, inovação e excelência na formação de advogados.', 'institucional', ARRAY['visão', 'educação', 'jurídica']),
('Valores da ESADI', 'Excelência, Inovação, Ética, Compromisso Social, Transparência e Colaboração.', 'institucional', ARRAY['valores', 'ética', 'transparência']),
('Cursos de Pós-Graduação', 'A ESADI oferece cursos de pós-graduação lato sensu em diversas áreas do direito, com corpo docente qualificado e metodologia inovadora.', 'cursos', ARRAY['pós-graduação', 'lato sensu', 'formação']),
('Cursos de Extensão', 'Programas de extensão e atualização profissional para advogados em diferentes áreas do direito.', 'cursos', ARRAY['extensão', 'atualização', 'profissional']),
('Eventos e Seminários', 'Organização de eventos, seminários e congressos para disseminação do conhecimento jurídico.', 'eventos', ARRAY['eventos', 'seminários', 'congressos']),
('Biblioteca Jurídica', 'Acervo especializado em direito com mais de 15.000 volumes, incluindo livros, periódicos e bases de dados.', 'infraestrutura', ARRAY['biblioteca', 'acervo', 'pesquisa']),
('Laboratório de Prática Jurídica', 'Espaço para simulação de audiências e desenvolvimento de habilidades práticas dos advogados.', 'infraestrutura', ARRAY['prática', 'simulação', 'habilidades']),
('Convênios Institucionais', 'Parcerias com instituições de ensino e organizações jurídicas para ampliar oportunidades de formação.', 'parcerias', ARRAY['convênios', 'parcerias', 'cooperação']),
('Programa de Estágio', 'Oportunidades de estágio para estudantes de direito em escritórios parceiros e órgãos públicos.', 'formação', ARRAY['estágio', 'estudantes', 'experiência']);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contextualization_data_category ON public.contextualization_data(category);
CREATE INDEX IF NOT EXISTS idx_contextualization_data_tags ON public.contextualization_data USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contextualization_data_title ON public.contextualization_data USING GIN(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_contextualization_data_content ON public.contextualization_data USING GIN(to_tsvector('portuguese', content));

-- Habilitar Row Level Security
ALTER TABLE public.contextualization_data ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Anyone can view contextualization data" ON public.contextualization_data
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert contextualization data" ON public.contextualization_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update contextualization data" ON public.contextualization_data
  FOR UPDATE USING (auth.role() = 'authenticated'); 