import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Copiando arquivos de contextualização...');

const sourceDir = path.join(__dirname, '..', 'src', 'data');
const targetDirs = [
  path.join(process.cwd(), 'public', 'data'),
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), 'dist', 'data'),
  path.join(process.cwd(), 'build', 'data')
];

// Criar diretórios de destino se não existirem
targetDirs.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Criado diretório: ${targetDir}`);
  }
});

// Copiar arquivos de contextualização
const contextualizationFiles = [
  'cardioprime-blumenau.json',
  'contextualizacao-esadi.json'
];

contextualizationFiles.forEach(filename => {
  const sourcePath = path.join(sourceDir, filename);
  
  if (fs.existsSync(sourcePath)) {
    targetDirs.forEach(targetDir => {
      const targetPath = path.join(targetDir, filename);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copiado: ${sourcePath} -> ${targetPath}`);
    });
  } else {
    console.warn(`Arquivo não encontrado: ${sourcePath}`);
  }
});

console.log('Arquivos de contextualização copiados com sucesso!');
