-- Script para adicionar coluna avatar_url na tabela whatsapp_conversations
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna já existe
SELECT 
  'VERIFICANDO COLUNA AVATAR_URL' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_conversations' 
AND column_name = 'avatar_url';

-- 2. Adicionar coluna avatar_url se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_conversations' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE whatsapp_conversations 
    ADD COLUMN avatar_url TEXT;
    
    RAISE NOTICE 'Coluna avatar_url adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna avatar_url já existe';
  END IF;
END $$;

-- 3. Verificar se a coluna foi criada
SELECT 
  'VERIFICANDO COLUNA CRIADA' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_conversations' 
AND column_name = 'avatar_url';

-- 4. Criar bucket de storage para avatars (se não existir)
-- Nota: Isso deve ser feito manualmente no painel do Supabase
-- 1. Vá para Storage no painel do Supabase
-- 2. Clique em "Create a new bucket"
-- 3. Nome: "avatars"
-- 4. Public bucket: true
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/*

-- 5. Configurar políticas de RLS para o bucket avatars
-- Nota: Execute estas políticas no SQL Editor após criar o bucket

-- Política para permitir upload de avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir visualização de avatars
CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
);

-- Política para permitir atualização de avatars
CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir remoção de avatars
CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 6. Verificar políticas criadas
SELECT 
  'VERIFICANDO POLÍTICAS' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'; 