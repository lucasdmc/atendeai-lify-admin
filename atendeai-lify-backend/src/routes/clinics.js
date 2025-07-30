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

// GET /api/clinics
router.get('/', async (req, res) => {
  try {
    // TODO: Implementar busca no banco de dados
    const mockClinics = [
      {
        id: 1,
        name: 'Clínica ESADI',
        address: 'Rua das Flores, 123',
        phone: '(11) 99999-9999',
        email: 'contato@esadi.com.br',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Clínica Teste',
        address: 'Av. Principal, 456',
        phone: '(11) 88888-8888',
        email: 'contato@teste.com.br',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      clinics: mockClinics,
      total: mockClinics.length
    });

  } catch (error) {
    console.error('Erro ao buscar clínicas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/clinics/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar busca no banco de dados
    const mockClinic = {
      id: parseInt(id),
      name: 'Clínica ESADI',
      address: 'Rua das Flores, 123',
      phone: '(11) 99999-9999',
      email: 'contato@esadi.com.br',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!mockClinic) {
      return res.status(404).json({
        error: 'Clínica não encontrada'
      });
    }

    res.json({
      clinic: mockClinic
    });

  } catch (error) {
    console.error('Erro ao buscar clínica:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/clinics
router.post('/', [
  body('name').isLength({ min: 2 }).trim(),
  body('address').isLength({ min: 5 }).trim(),
  body('phone').isLength({ min: 10 }).trim(),
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;

    // TODO: Implementar criação no banco de dados
    const newClinic = {
      id: 3,
      name,
      address,
      phone,
      email,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Clínica criada com sucesso',
      clinic: newClinic
    });

  } catch (error) {
    console.error('Erro ao criar clínica:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/clinics/:id
router.put('/:id', [
  body('name').optional().isLength({ min: 2 }).trim(),
  body('address').optional().isLength({ min: 5 }).trim(),
  body('phone').optional().isLength({ min: 10 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('status').optional().isIn(['active', 'inactive']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, status } = req.body;

    // TODO: Implementar atualização no banco de dados
    const updatedClinic = {
      id: parseInt(id),
      name: name || 'Clínica ESADI',
      address: address || 'Rua das Flores, 123',
      phone: phone || '(11) 99999-9999',
      email: email || 'contato@esadi.com.br',
      status: status || 'active',
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Clínica atualizada com sucesso',
      clinic: updatedClinic
    });

  } catch (error) {
    console.error('Erro ao atualizar clínica:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/clinics/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar exclusão no banco de dados
    // Verificar se clínica existe antes de deletar

    res.json({
      message: 'Clínica deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar clínica:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 