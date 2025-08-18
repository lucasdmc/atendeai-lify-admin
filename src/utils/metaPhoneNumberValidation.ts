export function isValidMetaPhoneNumberId(value: string): boolean {
	// Meta phone_number_id costuma ser um número longo (até 16-18 dígitos). Validamos como dígitos de 10 a 20 chars.
	return /^[0-9]{10,20}$/.test((value || '').trim());
}

export function normalizeDisplayPhone(value: string): string {
	if (!value) return '';
	const v = value.trim();
	if (v.startsWith('+')) return v;
	// Se já parece E.164 sem '+', adiciona
	if (/^[0-9]{12,15}$/.test(v)) return `+${v}`;
	return v;
}

export function normalizeWhatsappNumberForDb(value: string): string {
	// Remove tudo que não é dígito e remove o '+' se presente
	if (!value) return '';
	const digits = (value || '').replace(/[^0-9]/g, '');
	return digits;
}
