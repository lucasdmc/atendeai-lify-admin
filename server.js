import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://atendeai-lify-admin.vercel.app', 'https://atendeai-lify-admin.netlify.app']
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
  process.exit(1);
}

// Client para operações administrativas (Service Role Key)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Client para autenticação de usuários (Anon Key)
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Middleware de autenticação
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.substring(7);
    
    // Verificar token com Supabase usando Anon Key
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error) {
      console.error('Erro ao verificar token:', error);
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário tem permissão de admin
    const { data: profile, error: profileError } = await supabaseAuth
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 Buscando perfil para user_id:', user.id);
    console.log('🔍 Resultado:', { profile, profileError });

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    const allowedRoles = ['admin_lify', 'suporte_lify'];
    if (!allowedRoles.includes(profile.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente para criar usuários' });
    }

    req.user = user;
    req.userRole = profile.role;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota para criar usuários
app.post('/api/users/create', authenticateUser, async (req, res) => {
  try {
    const { name, email, password, role, clinicId } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios' 
      });
    }

    // Verificar se precisa de clínica e se foi fornecida
    const requiresClinic = role !== 'admin_lify' && role !== 'suporte_lify';
    if (requiresClinic && !clinicId) {
      return res.status(400).json({ 
        error: 'Clínica é obrigatória para este tipo de usuário' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verificar se o email já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Este email já está em uso' 
      });
    }

    // 1. Criar usuário no Supabase Auth
    console.log('Criando usuário no Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: role
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return res.status(400).json({ 
        error: authError.message 
      });
    }

    if (!authData.user) {
      return res.status(500).json({ 
        error: 'Falha ao criar usuário no sistema de autenticação' 
      });
    }

    const userId = authData.user.id;
    console.log('Usuário criado no Auth com ID:', userId);

    // 2. Criar perfil na tabela user_profiles
    console.log('Criando perfil na tabela user_profiles...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        user_id: userId,
        email: cleanEmail,
        name: name,
        role: role,
        status: true,
        clinic_id: requiresClinic ? clinicId : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Se falhar, deletar o usuário auth para manter consistência
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ 
        error: profileError.message 
      });
    }

    console.log('Perfil criado com sucesso para o usuário:', userId);

    // 3. Se o usuário precisa de clínica, criar associação na tabela clinic_users
    if (requiresClinic && clinicId) {
      console.log('Criando associação com clínica...');
      const { error: clinicUserError } = await supabase
        .from('clinic_users')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          role: role,
          is_active: true
        });

      if (clinicUserError) {
        console.error('Erro ao criar associação com clínica:', clinicUserError);
        // Se falhar, deletar o perfil e o usuário auth para manter consistência
        await supabase.from('user_profiles').delete().eq('user_id', userId);
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({ 
          error: clinicUserError.message 
        });
      }

      console.log('Associação com clínica criada com sucesso');
    }

    res.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: name,
        role: role,
        clinicId: requiresClinic ? clinicId : null
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para listar usuários (apenas para admins)
app.get('/api/users', authenticateUser, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        email,
        role,
        status,
        created_at,
        clinics(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alias para listagem de usuários (compatibilidade)
app.get('/api/users/list', authenticateUser, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        email,
        role,
        status,
        created_at,
        clinics(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar clínicas
app.get('/api/clinics', authenticateUser, async (req, res) => {
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, clinics });
  } catch (error) {
    console.error('Erro ao listar clínicas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor' 
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Service Role Key: ${supabaseServiceKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);
});

export default app; 