const express = require('express');
const { body, validationResult } = require('express-validator');
const ClinicService = require('../services/clinicService');

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
    const clinics = await ClinicService.getAllClinics();
    
    res.json({
      clinics: clinics,
      total: clinics.length
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

    const clinic = await ClinicService.getClinicById(id);

    if (!clinic) {
      return res.status(404).json({
        error: 'Clínica não encontrada'
      });
    }

    res.json({
      clinic: clinic
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

    const newClinic = await ClinicService.createClinic({
      name,
      address,
      phone,
      email,
      status: 'active'
    });

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

    const updates = {};
    if (name) updates.name = name;
    if (address) updates.address = address;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (status) updates.status = status;

    const updatedClinic = await ClinicService.updateClinic(id, updates);

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

    await ClinicService.deleteClinic(id);

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