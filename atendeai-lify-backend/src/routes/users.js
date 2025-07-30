const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware para validar resultados da validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Dados inválidos',
      details: errors.array() 
    });
  }
  next();
};

// GET /api/users
router.get('/', async (req, res) => {
  try {
    // TODO: Implementar busca no banco de dados
    const mockUsers = [
      {
        id: 1,
        name: 'Administrador',
        email: 'admin@atendeai.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Usuário Teste',
        email: 'user@atendeai.com',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      users: mockUsers,
      total: mockUsers.length
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar busca no banco de dados
    const mockUser = {
      id: parseInt(id),
      name: 'Administrador',
      email: 'admin@atendeai.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    if (!mockUser) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      user: mockUser
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/:id
router.put('/:id', [
  body('name').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'user']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // TODO: Implementar atualização no banco de dados
    const updatedUser = {
      id: parseInt(id),
      name: name || 'Administrador',
      email: email || 'admin@atendeai.com',
      role: role || 'admin',
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar exclusão no banco de dados
    // Verificar se usuário existe antes de deletar

    res.json({
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 