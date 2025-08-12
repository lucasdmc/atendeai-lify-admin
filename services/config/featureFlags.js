function isTrue(val) {
  return String(val).toLowerCase() === 'true';
}

const featureFlags = {
  CORE_ROUTING: isTrue(process.env.FEATURE_CORE_ROUTING || 'true'),
  CORE_APPOINTMENT_FLOW: isTrue(process.env.FEATURE_CORE_APPOINTMENT_FLOW || 'true'),
  CORE_WHATSAPP_RETRY: isTrue(process.env.FEATURE_CORE_WHATSAPP_RETRY || 'true'),
};

export default featureFlags;
