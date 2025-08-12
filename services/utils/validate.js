function assertString(name, value) {
  if (typeof value !== 'string') {
    throw new Error(`Validation error: ${name} must be a string`);
  }
}

function assertNonEmpty(name, value) {
  assertString(name, value);
  if (value.trim().length === 0) {
    throw new Error(`Validation error: ${name} must not be empty`);
  }
}

export function validateSendTextMessageInput({ accessToken, phoneNumberId, to, text }) {
  assertNonEmpty('accessToken', accessToken);
  assertNonEmpty('phoneNumberId', phoneNumberId);
  assertNonEmpty('to', to);
  assertNonEmpty('text', text);
}

export function validateSendMediaMessageInput({ accessToken, phoneNumberId, to, mediaId, type }) {
  assertNonEmpty('accessToken', accessToken);
  assertNonEmpty('phoneNumberId', phoneNumberId);
  assertNonEmpty('to', to);
  assertNonEmpty('mediaId', mediaId);
  assertNonEmpty('type', type);
}
