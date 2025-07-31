-- Corrigir tabela user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';

-- Atualizar registros existentes
UPDATE user_profiles SET role = 'admin' WHERE role IS NULL;

-- Verificar se a tabela está correta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position; 