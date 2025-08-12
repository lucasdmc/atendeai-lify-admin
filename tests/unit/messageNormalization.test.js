import assert from 'assert';
import { normalizeMessage } from '../../services/utils/messageNormalization.js';

try {
  const input = 'Lista de exames:\n1.Exame A 2.Exame B\n\n\nTexto  com  espaços  '\n    + String.fromCharCode(0x200B);
  const output = normalizeMessage(input);
  assert.ok(!/\u200B/.test(output), 'deve remover caracteres invisíveis');
  assert.ok(/Lista de exames:\n\n/.test(output), 'deve adicionar quebra dupla após títulos');
  assert.ok(/1\. Exame A\n2\. Exame B/.test(output), 'deve formatar listas numeradas');
  assert.ok(!/  /.test(output), 'não deve conter espaços duplos');
  assert.ok(!/\n{3,}/.test(output), 'não deve conter mais de duas quebras de linha seguidas');

  console.log('messageNormalization.test.js OK');
  process.exit(0);
} catch (err) {
  console.error('messageNormalization.test.js FAILED', err);
  process.exit(1);
}
