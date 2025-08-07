const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthService = require('../services/authService');

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

    const result = await AuthService.login(email, password);

    res.json({
      message: 'Login realizado com sucesso',
      user: result.user,
      token: result.token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(401).json({
      error: error.message || 'Credenciais inválidas'
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

    const result = await AuthService.register({ name, email, password });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.user,
      token: result.token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(400).json({
      error: error.message || 'Erro interno do servidor'
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
    const user = await AuthService.verifyToken(token);

    res.json({
      user: user
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({
      error: 'Token inválido'
    });
  }
});

module.exports = router; 