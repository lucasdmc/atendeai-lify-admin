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

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { clinicId, status, date } = req.query;

    // TODO: Implementar busca no banco de dados com filtros
    const mockAppointments = [
      {
        id: 1,
        patientName: 'João Silva',
        patientPhone: '(11) 99999-9999',
        patientEmail: 'joao@email.com',
        clinicId: 1,
        clinicName: 'Clínica ESADI',
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        status: 'confirmed',
        notes: 'Consulta de rotina',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        patientName: 'Maria Santos',
        patientPhone: '(11) 88888-8888',
        patientEmail: 'maria@email.com',
        clinicId: 1,
        clinicName: 'Clínica ESADI',
        date: '2024-01-16',
        time: '10:00',
        duration: 30,
        status: 'pending',
        notes: 'Primeira consulta',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      appointments: mockAppointments,
      total: mockAppointments.length
    });

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar busca no banco de dados
    const mockAppointment = {
      id: parseInt(id),
      patientName: 'João Silva',
      patientPhone: '(11) 99999-9999',
      patientEmail: 'joao@email.com',
      clinicId: 1,
      clinicName: 'Clínica ESADI',
      date: '2024-01-15',
      time: '14:00',
      duration: 60,
      status: 'confirmed',
      notes: 'Consulta de rotina',
      createdAt: new Date().toISOString()
    };

    if (!mockAppointment) {
      return res.status(404).json({
        error: 'Agendamento não encontrado'
      });
    }

    res.json({
      appointment: mockAppointment
    });

  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/appointments
router.post('/', [
  body('patientName').isLength({ min: 2 }).trim(),
  body('patientPhone').isLength({ min: 10 }).trim(),
  body('patientEmail').isEmail().normalizeEmail(),
  body('clinicId').isInt({ min: 1 }),
  body('date').isISO8601(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duration').isInt({ min: 15, max: 480 }),
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      patientName, 
      patientPhone, 
      patientEmail, 
      clinicId, 
      date, 
      time, 
      duration, 
      status = 'pending',
      notes 
    } = req.body;

    // TODO: Implementar criação no banco de dados
    // TODO: Verificar disponibilidade do horário
    const newAppointment = {
      id: 3,
      patientName,
      patientPhone,
      patientEmail,
      clinicId,
      clinicName: 'Clínica ESADI',
      date,
      time,
      duration,
      status,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      appointment: newAppointment
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/appointments/:id
router.put('/:id', [
  body('patientName').optional().isLength({ min: 2 }).trim(),
  body('patientPhone').optional().isLength({ min: 10 }).trim(),
  body('patientEmail').optional().isEmail().normalizeEmail(),
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duration').optional().isInt({ min: 15, max: 480 }),
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      patientName, 
      patientPhone, 
      patientEmail, 
      date, 
      time, 
      duration, 
      status, 
      notes 
    } = req.body;

    // TODO: Implementar atualização no banco de dados
    const updatedAppointment = {
      id: parseInt(id),
      patientName: patientName || 'João Silva',
      patientPhone: patientPhone || '(11) 99999-9999',
      patientEmail: patientEmail || 'joao@email.com',
      clinicId: 1,
      clinicName: 'Clínica ESADI',
      date: date || '2024-01-15',
      time: time || '14:00',
      duration: duration || 60,
      status: status || 'confirmed',
      notes: notes || 'Consulta de rotina',
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Agendamento atualizado com sucesso',
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar exclusão no banco de dados
    // Verificar se agendamento existe antes de deletar

    res.json({
      message: 'Agendamento deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/appointments/clinic/:clinicId
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { date, status } = req.query;

    // TODO: Implementar busca por clínica no banco de dados
    const mockAppointments = [
      {
        id: 1,
        patientName: 'João Silva',
        patientPhone: '(11) 99999-9999',
        patientEmail: 'joao@email.com',
        clinicId: parseInt(clinicId),
        clinicName: 'Clínica ESADI',
        date: date || '2024-01-15',
        time: '14:00',
        duration: 60,
        status: status || 'confirmed',
        notes: 'Consulta de rotina',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      appointments: mockAppointments,
      total: mockAppointments.length
    });

  } catch (error) {
    console.error('Erro ao buscar agendamentos da clínica:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 