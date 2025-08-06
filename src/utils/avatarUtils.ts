/**
 * Utilitários para geração de avatares e fotos de perfil
 */

export interface AvatarOptions {
  name: string;
  email?: string;
  phone?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Gera um avatar baseado em iniciais com cores personalizadas
 */
export function generateInitialsAvatar(options: AvatarOptions): string {
  const { name, size = 200, backgroundColor = '#10B981', textColor = '#FFFFFF' } = options;
  
  // Extrair iniciais
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // Gerar SVG
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="50%"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Gera um avatar usando o serviço DiceBear
 */
export function generateDiceBearAvatar(options: AvatarOptions): string {
  const { name, size = 200 } = options;
  
  // Usar o nome como seed para consistência
  const seed = encodeURIComponent(name);
  
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${size}`;
}

/**
 * Gera um avatar usando Gravatar (se email disponível)
 */
export function generateGravatarAvatar(options: AvatarOptions): string | null {
  const { email, size = 200 } = options;
  
  if (!email) return null;
  
  // Calcular hash MD5 do email (simulado)
  const hash = btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
  
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}

/**
 * Gera um avatar usando o serviço UI Avatars
 */
export function generateUIAvatar(options: AvatarOptions): string {
  const { name, size = 200, backgroundColor = '10B981', textColor = 'FFFFFF' } = options;
  
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=${textColor}&size=${size}&font-size=0.4&bold=true&length=2`;
}

/**
 * Função principal para obter a melhor opção de avatar
 */
export function getAvatarUrl(options: AvatarOptions): string {
  // 1. Tentar Gravatar primeiro (se email disponível)
  if (options.email) {
    const gravatarUrl = generateGravatarAvatar(options);
    if (gravatarUrl) {
      return gravatarUrl;
    }
  }

  // 2. Usar UI Avatars como fallback
  return generateUIAvatar(options);
}

/**
 * Verifica se uma URL de imagem é válida
 */
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Gera cores baseadas no nome para consistência
 */
export function generateColorsFromName(name: string): { backgroundColor: string; textColor: string } {
  const colors = [
    { bg: '#10B981', text: '#FFFFFF' }, // Verde
    { bg: '#3B82F6', text: '#FFFFFF' }, // Azul
    { bg: '#8B5CF6', text: '#FFFFFF' }, // Roxo
    { bg: '#F59E0B', text: '#FFFFFF' }, // Amarelo
    { bg: '#EF4444', text: '#FFFFFF' }, // Vermelho
    { bg: '#06B6D4', text: '#FFFFFF' }, // Ciano
    { bg: '#84CC16', text: '#FFFFFF' }, // Verde claro
    { bg: '#F97316', text: '#FFFFFF' }, // Laranja
  ];

  // Usar o nome como seed para escolher cor consistente
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  
  return colors[colorIndex];
} 