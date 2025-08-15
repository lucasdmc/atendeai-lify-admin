const { supabase } = require('../config/database');

class UserService {
  // Buscar todos os usuários
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw new Error('Erro ao buscar usuários');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no UserService.getAllUsers:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        throw new Error('Usuário não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Erro no UserService.getUserById:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async updateUser(id, updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw new Error('Erro ao atualizar usuário');
      }

      return data;
    } catch (error) {
      console.error('Erro no UserService.updateUser:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async deleteUser(id) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar usuário:', error);
        throw new Error('Erro ao deletar usuário');
      }

      return true;
    } catch (error) {
      console.error('Erro no UserService.deleteUser:', error);
      throw error;
    }
  }

  // Criar usuário
  static async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw new Error('Erro ao criar usuário');
      }

      return data;
    } catch (error) {
      console.error('Erro no UserService.createUser:', error);
      throw error;
    }
  }
}

module.exports = UserService; 