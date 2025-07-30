const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO: Implementar verificação no banco de dados
    // Por enquanto, retornamos um mock
    const mockUser = {
      id: 1,
      email: 'admin@atendeai.com',
      name: 'Administrador',
      role: 'admin'
    };

    // TODO: Verificar senha com bcrypt.compare()
    if (email !== mockUser.email || password !== '123456') {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role
      },
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/register
router.post('/register', [
  body('name').isLength({ min: 2 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // TODO: Verificar se usuário já existe
    // TODO: Hash da senha com bcrypt
    // TODO: Salvar no banco de dados

    const hashedPassword = await bcrypt.hash(password, 12);

    // Mock de resposta
    const newUser = {
      id: 2,
      name,
      email,
      role: 'user'
    };

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token não fornecido'
      });
    }

    // TODO: Verificar token e gerar novo
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const newToken = jwt.sign(
      { 
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Token renovado com sucesso',
      token: newToken
    });

  } catch (error) {
    console.error('Erro na renovação do token:', error);
    res.status(401).json({
      error: 'Token inválido'
    });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // TODO: Buscar usuário no banco de dados
    const mockUser = {
      id: decoded.userId,
      email: decoded.email,
      name: 'Administrador',
      role: decoded.role
    };

    res.json({
      user: mockUser
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({
      error: 'Token inválido'
    });
  }
});

module.exports = router; 