const express = require('express');
const { body, validationResult } = require('express-validator');
const AppointmentService = require('../services/appointmentService');

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

    let appointments;
    
    if (clinicId) {
      appointments = await AppointmentService.getAppointmentsByClinic(clinicId);
    } else {
      appointments = await AppointmentService.getAllAppointments();
    }

    // Aplicar filtros adicionais se necessário
    if (status) {
      appointments = appointments.filter(apt => apt.status === status);
    }
    
    if (date) {
      appointments = appointments.filter(apt => apt.date === date);
    }

    res.json({
      appointments: appointments,
      total: appointments.length
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

    const appointment = await AppointmentService.getAppointmentById(id);

    if (!appointment) {
      return res.status(404).json({
        error: 'Agendamento não encontrado'
      });
    }

    res.json({
      appointment: appointment
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

    const newAppointment = await AppointmentService.createAppointment({
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_email: patientEmail,
      clinic_id: clinicId,
      date,
      time,
      duration,
      status,
      notes: notes || ''
    });

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

    const updates = {};
    if (patientName) updates.patient_name = patientName;
    if (patientPhone) updates.patient_phone = patientPhone;
    if (patientEmail) updates.patient_email = patientEmail;
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (duration) updates.duration = duration;
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const updatedAppointment = await AppointmentService.updateAppointment(id, updates);

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

    await AppointmentService.deleteAppointment(id);

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