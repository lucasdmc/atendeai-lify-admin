const { supabase } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  // Login de usuário
  static async login(email, password) {
    try {
      // Buscar usuário por email
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha (assumindo que está hasheada no banco)
      const isValidPassword = await bcrypt.compare(password, user.password_hash || password);
      
      if (!isValidPassword) {
        throw new Error('Senha inválida');
      }

      // Gerar JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role || 'user'
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user'
        },
        token
      };
    } catch (error) {
      console.error('Erro no AuthService.login:', error);
      throw error;
    }
  }

  // Registrar novo usuário
  static async register(userData) {
    try {
      const { name, email, password } = userData;

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Usuário já existe');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário
      const { data: newUser, error } = await supabase
        .from('user_profiles')
        .insert([{
          name,
          email,
          password_hash: hashedPassword,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw new Error('Erro ao criar usuário');
      }

      // Gerar JWT token
      const token = jwt.sign(
        { 
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        token
      };
    } catch (error) {
      console.error('Erro no AuthService.register:', error);
      throw error;
    }
  }

  // Verificar token
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Buscar usuário no banco
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, email, name, role')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        throw new Error('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      console.error('Erro no AuthService.verifyToken:', error);
      throw error;
    }
  }
}

module.exports = AuthService; 