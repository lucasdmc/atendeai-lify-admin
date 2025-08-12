import assert from 'assert';
import ClinicRoutingRepository from '../../services/core/clinicRoutingRepository.js';

// Mock Supabase
function makeSupabaseMock({ byPhoneNumberIdClinicId = null, byDisplayPhoneClinicId = null, byPatientHistoryClinicId = null } = {}) {
  return {
    from(table) {
      this._table = table;
      return this;
    },
    select() { return this; },
    eq(field, value) {
      this._eq = { field, value };
      return this;
    },
    order() { return this; },
    limit() { return this; },
    maybeSingle: async () => {
      if (this._table === 'clinic_whatsapp_numbers' && this._eq?.field === 'phone_number_id') {
        return { data: byPhoneNumberIdClinicId ? { clinic_id: byPhoneNumberIdClinicId } : null, error: null };
      }
      if (this._table === 'clinics' && this._eq?.field === 'whatsapp_phone') {
        return { data: byDisplayPhoneClinicId ? { id: byDisplayPhoneClinicId } : null, error: null };
      }
      if (this._table === 'whatsapp_conversations_improved' && this._eq?.field === 'patient_phone_number') {
        return { data: byPatientHistoryClinicId ? { clinic_id: byPatientHistoryClinicId } : null, error: null };
      }
      return { data: null, error: null };
    }
  };
}

try {
  // 1) Resolve via phone_number_id
  const repo1 = new ClinicRoutingRepository();
  repo1.supabase = makeSupabaseMock({ byPhoneNumberIdClinicId: 'clinic-123' });
  const id1 = await repo1.resolveClinicByWebhook({ phoneNumberId: 'pn_1', displayPhoneNumber: null, patientPhone: null });
  assert.strictEqual(id1, 'clinic-123');

  // 2) Resolve via display_phone_number
  const repo2 = new ClinicRoutingRepository();
  repo2.supabase = makeSupabaseMock({ byDisplayPhoneClinicId: 'clinic-456' });
  const id2 = await repo2.resolveClinicByWebhook({ phoneNumberId: null, displayPhoneNumber: '5511999999999', patientPhone: null });
  assert.strictEqual(id2, 'clinic-456');

  // 3) Resolve via patient history
  const repo3 = new ClinicRoutingRepository();
  repo3.supabase = makeSupabaseMock({ byPatientHistoryClinicId: 'clinic-789' });
  const id3 = await repo3.resolveClinicByWebhook({ phoneNumberId: null, displayPhoneNumber: null, patientPhone: '5511888888888' });
  assert.strictEqual(id3, 'clinic-789');

  console.log('routingRepository.test.js OK');
  process.exit(0);
} catch (err) {
  console.error('routingRepository.test.js FAILED', err);
  process.exit(1);
}
