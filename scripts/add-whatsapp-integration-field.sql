-- Script para adicionar campo de integração WhatsApp na tabela clinics
-- Execute via Supabase Dashboard SQL Editor
-- Adicionar coluna para configuração de integração WhatsApp
DO $$ BEGIN -- Adicionar coluna whatsapp_integration_type se não existir
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinics'
        AND column_name = 'whatsapp_integration_type'
) THEN
ALTER TABLE public.clinics
ADD COLUMN whatsapp_integration_type TEXT DEFAULT 'baileys' CHECK (
        whatsapp_integration_type IN ('baileys', 'meta_api')
    );
END IF;
-- Adicionar coluna whatsapp_meta_config se não existir
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinics'
        AND column_name = 'whatsapp_meta_config'
) THEN
ALTER TABLE public.clinics
ADD COLUMN whatsapp_meta_config JSONB DEFAULT '{}';
END IF;
-- Adicionar coluna whatsapp_baileys_config se não existir
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinics'
        AND column_name = 'whatsapp_baileys_config'
) THEN
ALTER TABLE public.clinics
ADD COLUMN whatsapp_baileys_config JSONB DEFAULT '{}';
END IF;
-- Adicionar coluna whatsapp_connection_status se não existir
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinics'
        AND column_name = 'whatsapp_connection_status'
) THEN
ALTER TABLE public.clinics
ADD COLUMN whatsapp_connection_status TEXT DEFAULT 'disconnected' CHECK (
        whatsapp_connection_status IN (
            'disconnected',
            'connecting',
            'connected',
            'error'
        )
    );
END IF;
-- Adicionar coluna whatsapp_last_connection se não existir
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinics'
        AND column_name = 'whatsapp_last_connection'
) THEN
ALTER TABLE public.clinics
ADD COLUMN whatsapp_last_connection TIMESTAMP WITH TIME ZONE;
END IF;
RAISE NOTICE 'Colunas de integração WhatsApp adicionadas com sucesso!';
END $$;
-- Comentários para documentação
COMMENT ON COLUMN public.clinics.whatsapp_integration_type IS 'Tipo de integração WhatsApp: baileys (WhatsApp Web) ou meta_api (API oficial)';
COMMENT ON COLUMN public.clinics.whatsapp_meta_config IS 'Configurações para integração com API oficial da Meta (access_token, phone_number_id, etc.)';
COMMENT ON COLUMN public.clinics.whatsapp_baileys_config IS 'Configurações para integração Baileys (session_data, qr_code, etc.)';
COMMENT ON COLUMN public.clinics.whatsapp_connection_status IS 'Status atual da conexão WhatsApp';
COMMENT ON COLUMN public.clinics.whatsapp_last_connection IS 'Data/hora da última conexão WhatsApp';
-- Atualizar clínicas existentes para usar Baileys por padrão
UPDATE public.clinics
SET whatsapp_integration_type = 'baileys'
WHERE whatsapp_integration_type IS NULL;
-- Verificar resultado
SELECT id,
    name,
    whatsapp_integration_type,
    whatsapp_connection_status,
    whatsapp_last_connection
FROM public.clinics;