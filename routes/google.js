import express from 'express';
import { GoogleCalendarService, ClinicContextManager } from '../services/core/index.js';
import config from '../services/config/index.js';

const router = express.Router();
const googleService = new GoogleCalendarService();
const supabase = config.getSupabaseClient();

// Inicialização preguiçosa
async function ensureInitialized() {
	if (!googleService.credentials) {
		await googleService.initialize();
	}
}

// Iniciar OAuth por clínica
router.post('/oauth/start', async (req, res) => {
	try {
		const { clinicId } = req.body || {};
		if (!clinicId) return res.status(400).json({ success: false, error: 'clinicId é obrigatório' });
		await ensureInitialized();
		const url = googleService.generateAuthUrl(clinicId);
		return res.json({ success: true, data: { url } });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro ao iniciar OAuth' });
	}
});

// Callback OAuth (code + state=clinicId)
router.get('/oauth/callback', async (req, res) => {
	try {
		const { code, state } = req.query || {};
		if (!code || !state) return res.status(400).json({ success: false, error: 'code e state são obrigatórios' });
		await ensureInitialized();
		await googleService.processAuthCode(String(code), String(state));
		return res.json({ success: true });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro no callback OAuth' });
	}
});

// Status da sessão por clínica
router.get('/session/status', async (req, res) => {
	try {
		const { clinicId } = req.query || {};
		if (!clinicId) return res.status(400).json({ success: false, error: 'clinicId é obrigatório' });
		await ensureInitialized();
		try {
			await googleService.authenticateForClinic(String(clinicId));
			return res.json({ success: true, data: { connected: true } });
		} catch (e) {
			return res.json({ success: true, data: { connected: false, reason: e?.message || 'Não conectado' } });
		}
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro ao verificar status' });
	}
});

// Listar calendários disponíveis para a clínica autenticada
router.get('/calendars/list', async (req, res) => {
	try {
		const { clinicId } = req.query || {};
		if (!clinicId) return res.status(400).json({ success: false, error: 'clinicId é obrigatório' });
		await ensureInitialized();
		await googleService.authenticateForClinic(String(clinicId));
		const calendars = await googleService.getAvailableCalendars(String(clinicId));
		return res.json({ success: true, data: calendars });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro ao listar calendários' });
	}
});

// Associar calendários à clínica
router.post('/calendars/associate', async (req, res) => {
	try {
		const { clinicId, calendarIds } = req.body || {};
		if (!clinicId || !Array.isArray(calendarIds) || calendarIds.length === 0) {
			return res.status(400).json({ success: false, error: 'clinicId e calendarIds[] são obrigatórios' });
		}

		// Upsert em clinic_calendars
		const rows = calendarIds.map((id) => ({ clinic_id: clinicId, calendar_id: id, is_active: true }));
		const { error } = await supabase.from('clinic_calendars').upsert(rows, { onConflict: 'clinic_id,calendar_id' });
		if (error) throw error;
		return res.json({ success: true });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro ao associar calendários' });
	}
});

// Desconectar OAuth e remover calendários associados
router.delete('/oauth/disconnect', async (req, res) => {
	try {
		const { clinicId } = req.query || {};
		if (!clinicId) return res.status(400).json({ success: false, error: 'clinicId é obrigatório' });
		await ensureInitialized();

		// Limpar calendários associados
		const { error: calErr } = await supabase.from('clinic_calendars').delete().eq('clinic_id', clinicId);
		if (calErr) throw calErr;

		// Limpar tokens
		const { error: tokErr } = await supabase.from('google_calendar_tokens_by_clinic').delete().eq('clinic_id', clinicId);
		if (tokErr) throw tokErr;

		return res.json({ success: true });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro ao desconectar OAuth' });
	}
});

// Disponibilidade por clínica (slots agregados)
router.get('/availability', async (req, res) => {
	try {
		const { clinicId, serviceKey, professionalKey, daysAhead } = req.query || {};
		if (!clinicId) return res.status(400).json({ success: false, error: 'clinicId é obrigatório' });
		await ensureInitialized();

		// Buscar nome da clínica e/ou JSON
		const { data: clinicRow, error: clinicErr } = await supabase
			.from('clinics')
			.select('id, name, contextualization_json')
			.eq('id', clinicId)
			.maybeSingle();
		if (clinicErr || !clinicRow) throw new Error('Clínica não encontrada');

		// Obter contexto completo via ClinicContextManager usando o nome
		const clinicContext = await ClinicContextManager.getClinicContext(clinicRow.name);

		// Selecionar serviço alvo
		let selectedService = null;
		const services = clinicContext?.servicesDetails || {};
		const pickFirst = () => {
			const all = [
				...(services.consultas || []),
				...(services.exames || []),
				...(services.procedimentos || []),
			];
			return all.length > 0 ? all[0] : null;
		};
		if (serviceKey && services?.consultas) {
			selectedService = (services.consultas || []).find((s) => (s.id || s.nome) === serviceKey) || pickFirst();
		} else {
			selectedService = pickFirst();
		}
		if (!selectedService) throw new Error('Nenhum serviço disponível para gerar disponibilidade');

		// Autenticar e obter slots via serviço
		await googleService.authenticateForClinic(String(clinicId));
		const slots = await googleService.getAvailableSlots(
			String(clinicId),
			clinicContext,
			{ id: selectedService.id || selectedService.nome, name: selectedService.nome || selectedService.id, duration: parseInt(selectedService.duracao) || 30 },
			Math.min(parseInt(daysAhead) || 14, 30)
		);

		return res.json({ success: true, data: { slots } });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message || 'Erro ao obter disponibilidade' });
	}
});

export default router;
