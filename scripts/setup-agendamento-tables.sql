-- Script para configurar tabelas de agendamento inteligente
-- Execute este script no painel do Supabase

-- 1. Tabela de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    data_nascimento DATE,
    cpf VARCHAR(14),
    convenio VARCHAR(100),
    numero_carteirinha VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    profissional_id VARCHAR(50) NOT NULL, -- ID do profissional da contextualização
    servico_id VARCHAR(50) NOT NULL, -- ID do serviço da contextualização
    data DATE NOT NULL,
    horario TIME NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'remarcado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de conversas de agendamento
CREATE TABLE IF NOT EXISTS conversas_agendamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telefone VARCHAR(20) NOT NULL,
    dados_conversa JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de disponibilidade de horários (para controle de agenda)
CREATE TABLE IF NOT EXISTS disponibilidade_horarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profissional_id VARCHAR(50) NOT NULL,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    disponivel BOOLEAN DEFAULT true,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profissional_id, data, horario_inicio)
);

-- 5. Tabela de histórico de agendamentos
CREATE TABLE IF NOT EXISTS historico_agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
    acao VARCHAR(50) NOT NULL, -- 'criado', 'confirmado', 'cancelado', 'remarcado'
    dados_anteriores JSONB,
    dados_novos JSONB,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes(telefone);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON agendamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_conversas_telefone ON conversas_agendamento(telefone);
CREATE INDEX IF NOT EXISTS idx_disponibilidade_profissional_data ON disponibilidade_horarios(profissional_id, data);
CREATE INDEX IF NOT EXISTS idx_historico_agendamento ON historico_agendamentos(agendamento_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversas_updated_at BEFORE UPDATE ON conversas_agendamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disponibilidade_updated_at BEFORE UPDATE ON disponibilidade_horarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION registrar_historico_agendamento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO historico_agendamentos (agendamento_id, acao, dados_novos)
        VALUES (NEW.id, 'criado', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO historico_agendamentos (agendamento_id, acao, dados_anteriores, dados_novos)
        VALUES (NEW.id, 'atualizado', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO historico_agendamentos (agendamento_id, acao, dados_anteriores)
        VALUES (OLD.id, 'excluido', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para histórico de agendamentos
CREATE TRIGGER trigger_historico_agendamentos
    AFTER INSERT OR UPDATE OR DELETE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION registrar_historico_agendamento();

-- Políticas RLS (Row Level Security)
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidade_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (admin)
CREATE POLICY "Usuários autenticados podem gerenciar pacientes" ON pacientes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar agendamentos" ON agendamentos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar conversas" ON conversas_agendamento
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar disponibilidade" ON disponibilidade_horarios
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem visualizar histórico" ON historico_agendamentos
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para service role (Edge Functions)
CREATE POLICY "Service role pode gerenciar pacientes" ON pacientes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role pode gerenciar agendamentos" ON agendamentos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role pode gerenciar conversas" ON conversas_agendamento
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role pode gerenciar disponibilidade" ON disponibilidade_horarios
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role pode visualizar histórico" ON historico_agendamentos
    FOR ALL USING (auth.role() = 'service_role');

-- Inserir dados de exemplo (opcional)
INSERT INTO pacientes (nome, telefone, email, convenio) VALUES
('João Silva', '47999999999', 'joao@email.com', 'Unimed'),
('Maria Santos', '47988888888', 'maria@email.com', 'Bradesco Saúde')
ON CONFLICT (telefone) DO NOTHING;

-- Função para verificar disponibilidade
CREATE OR REPLACE FUNCTION verificar_disponibilidade(
    p_profissional_id VARCHAR(50),
    p_data DATE,
    p_horario_inicio TIME,
    p_horario_fim TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    v_disponivel BOOLEAN;
BEGIN
    SELECT disponivel INTO v_disponivel
    FROM disponibilidade_horarios
    WHERE profissional_id = p_profissional_id
      AND data = p_data
      AND horario_inicio = p_horario_inicio
      AND horario_fim = p_horario_fim;
    
    RETURN COALESCE(v_disponivel, true);
END;
$$ LANGUAGE plpgsql;

-- Função para bloquear horário
CREATE OR REPLACE FUNCTION bloquear_horario(
    p_profissional_id VARCHAR(50),
    p_data DATE,
    p_horario_inicio TIME,
    p_horario_fim TIME,
    p_agendamento_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO disponibilidade_horarios (profissional_id, data, horario_inicio, horario_fim, disponivel, agendamento_id)
    VALUES (p_profissional_id, p_data, p_horario_inicio, p_horario_fim, false, p_agendamento_id)
    ON CONFLICT (profissional_id, data, horario_inicio)
    DO UPDATE SET
        disponivel = false,
        agendamento_id = p_agendamento_id,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para liberar horário
CREATE OR REPLACE FUNCTION liberar_horario(
    p_profissional_id VARCHAR(50),
    p_data DATE,
    p_horario_inicio TIME
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE disponibilidade_horarios
    SET disponivel = true,
        agendamento_id = NULL,
        updated_at = NOW()
    WHERE profissional_id = p_profissional_id
      AND data = p_data
      AND horario_inicio = p_horario_inicio;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE pacientes IS 'Tabela de pacientes da clínica';
COMMENT ON TABLE agendamentos IS 'Tabela de agendamentos de consultas e exames';
COMMENT ON TABLE conversas_agendamento IS 'Tabela para armazenar conversas de agendamento via chatbot';
COMMENT ON TABLE disponibilidade_horarios IS 'Tabela para controle de disponibilidade de horários';
COMMENT ON TABLE historico_agendamentos IS 'Tabela de histórico de mudanças nos agendamentos';

COMMENT ON COLUMN agendamentos.profissional_id IS 'ID do profissional da contextualização (prof_001, prof_002, etc.)';
COMMENT ON COLUMN agendamentos.servico_id IS 'ID do serviço da contextualização (cons_001, exam_001, etc.)';
COMMENT ON COLUMN agendamentos.status IS 'Status do agendamento: agendado, confirmado, cancelado, realizado, remarcado';

PRINT '✅ Tabelas de agendamento criadas com sucesso!';
PRINT '📋 Tabelas criadas:';
PRINT '   - pacientes';
PRINT '   - agendamentos';
PRINT '   - conversas_agendamento';
PRINT '   - disponibilidade_horarios';
PRINT '   - historico_agendamentos';
PRINT '';
PRINT '🔧 Funcionalidades adicionadas:';
PRINT '   - Triggers para updated_at automático';
PRINT '   - Sistema de histórico de agendamentos';
PRINT '   - Funções para controle de disponibilidade';
PRINT '   - Políticas RLS configuradas';
PRINT '';
PRINT '🚀 Próximo passo: Execute o script de configuração da Edge Function de agendamento.'; 