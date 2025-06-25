
export interface ValidationResult {
  isValid: boolean;
  value?: any;
  issues: string[];
  suggestions: string[];
  confidence: number; // 0-1, onde 1 = totalmente confiante
}

export class InputValidator {
  static validateName(input: string): ValidationResult {
    const cleanInput = input.trim();
    
    // Casos claramente inválidos
    if (!cleanInput || cleanInput.length < 2) {
      return {
        isValid: false,
        issues: ['Nome muito curto'],
        suggestions: ['Por favor, me informe seu nome completo'],
        confidence: 1
      };
    }

    // Verificar se contém apenas números
    if (/^\d+$/.test(cleanInput)) {
      return {
        isValid: false,
        issues: ['Nome não pode conter apenas números'],
        suggestions: ['Me informe seu nome por extenso (ex: João Silva)'],
        confidence: 1
      };
    }

    // Verificar se contém email no meio do nome
    if (cleanInput.includes('@')) {
      const namePart = cleanInput.split('@')[0].trim();
      if (namePart.length > 2) {
        return {
          isValid: false,
          issues: ['Nome misturado com email'],
          suggestions: [`Você quis dizer "${namePart}" como nome? Me confirme o nome separado do email.`],
          confidence: 0.7
        };
      }
    }

    // Verificar caracteres válidos
    if (!/^[A-Za-zÀ-ÿ\s\-'\.]+$/.test(cleanInput)) {
      return {
        isValid: false,
        issues: ['Nome contém caracteres inválidos'],
        suggestions: ['Use apenas letras, espaços e acentos (ex: José da Silva)'],
        confidence: 0.9
      };
    }

    // Nome muito longo (provavelmente erro)
    if (cleanInput.length > 80) {
      return {
        isValid: false,
        issues: ['Nome muito longo'],
        suggestions: ['Por favor, me informe apenas seu nome completo'],
        confidence: 0.8
      };
    }

    // Verificar se tem pelo menos uma palavra válida
    const words = cleanInput.split(/\s+/).filter(word => word.length > 1);
    if (words.length === 0) {
      return {
        isValid: false,
        issues: ['Nome não identificado'],
        suggestions: ['Me informe seu nome completo (ex: Maria Santos)'],
        confidence: 1
      };
    }

    // Nome válido
    return {
      isValid: true,
      value: cleanInput,
      issues: [],
      suggestions: [],
      confidence: words.length >= 2 ? 1 : 0.8
    };
  }

  static validateEmail(input: string): ValidationResult {
    const cleanInput = input.trim().toLowerCase();
    
    if (!cleanInput) {
      return {
        isValid: false,
        issues: ['Email não informado'],
        suggestions: ['Por favor, me informe seu email'],
        confidence: 1
      };
    }

    // Padrão básico de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Email incompleto mas com @
    if (cleanInput.includes('@') && !emailRegex.test(cleanInput)) {
      const parts = cleanInput.split('@');
      if (parts.length === 2) {
        const [user, domain] = parts;
        
        // Domínio incompleto
        if (!domain.includes('.')) {
          const commonDomains = ['gmail.com', 'hotmail.com', 'yahoo.com.br', 'outlook.com'];
          const suggestions = commonDomains.map(d => `${user}@${d}`);
          
          return {
            isValid: false,
            issues: ['Email incompleto - falta a terminação'],
            suggestions: [`Você quis dizer: ${suggestions.slice(0, 2).join(' ou ')}?`],
            confidence: 0.7
          };
        }
        
        // Extensão muito curta
        if (domain.split('.').pop()!.length < 2) {
          return {
            isValid: false,
            issues: ['Extensão do email muito curta'],
            suggestions: ['Exemplo de email válido: exemplo@gmail.com'],
            confidence: 0.9
          };
        }
      }
    }

    // Sem @ mas parece email
    if (!cleanInput.includes('@') && cleanInput.includes('.')) {
      return {
        isValid: false,
        issues: ['Email sem @'],
        suggestions: [`Você quis dizer "${cleanInput.replace('.', '@')}"?`],
        confidence: 0.6
      };
    }

    // Email válido
    if (emailRegex.test(cleanInput)) {
      return {
        isValid: true,
        value: cleanInput,
        issues: [],
        suggestions: [],
        confidence: 1
      };
    }

    // Caso geral - inválido
    return {
      isValid: false,
      issues: ['Email em formato inválido'],
      suggestions: ['Use o formato: seunome@exemplo.com'],
      confidence: 1
    };
  }

  static validateTime(input: string): ValidationResult {
    const cleanInput = input.trim().toLowerCase();
    
    // Extrair horário do texto
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})h/,
      /às?\s*(\d{1,2})/i,
      /(\d{1,2})\s*da\s*(manhã|tarde)/i
    ];

    let extractedTime = '';
    let hour = 0;

    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) {
        if (pattern.source.includes('manhã|tarde')) {
          hour = parseInt(match[1]);
          if (match[2] === 'tarde' && hour < 12) hour += 12;
        } else {
          hour = parseInt(match[1]);
        }
        extractedTime = `${hour.toString().padStart(2, '0')}:00`;
        break;
      }
    }

    if (!extractedTime) {
      return {
        isValid: false,
        issues: ['Horário não identificado'],
        suggestions: ['Me informe o horário (ex: 10h, 14:00, às 15h)'],
        confidence: 1
      };
    }

    // Validar se está no horário de funcionamento
    const validHours = [8, 9, 10, 11, 14, 15, 16, 17];
    if (!validHours.includes(hour)) {
      return {
        isValid: false,
        issues: ['Horário fora do funcionamento'],
        suggestions: [`Nossos horários são: ${validHours.slice(0, 4).join('h, ')}h (manhã) e ${validHours.slice(4).join('h, ')}h (tarde)`],
        confidence: 1
      };
    }

    return {
      isValid: true,
      value: extractedTime,
      issues: [],
      suggestions: [],
      confidence: 1
    };
  }

  static validateDate(input: string): ValidationResult {
    const cleanInput = input.trim().toLowerCase();
    
    let selectedDate = '';
    
    // Detectar "amanhã"
    if (cleanInput.includes('amanha') || cleanInput.includes('amanhã')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      selectedDate = tomorrow.toLocaleDateString('pt-BR');
    }
    
    // Detectar datas no formato DD/MM ou DD/MM/YYYY
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})\/(\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
        
        // Validações básicas
        if (day < 1 || day > 31) {
          return {
            isValid: false,
            issues: ['Dia inválido'],
            suggestions: ['Use um dia entre 1 e 31 (ex: 25/06)'],
            confidence: 1
          };
        }
        
        if (month < 1 || month > 12) {
          return {
            isValid: false,
            issues: ['Mês inválido'],
            suggestions: ['Use um mês entre 1 e 12 (ex: 25/06)'],
            confidence: 1
          };
        }
        
        selectedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        break;
      }
    }

    if (!selectedDate) {
      return {
        isValid: false,
        issues: ['Data não identificada'],
        suggestions: ['Me informe a data (ex: amanhã, 26/06, 26/06/2025)'],
        confidence: 1
      };
    }

    // Verificar se não é no passado
    const inputDate = new Date(selectedDate.split('/').reverse().join('-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate < today) {
      return {
        isValid: false,
        issues: ['Data no passado'],
        suggestions: ['Escolha uma data futura (ex: amanhã, próxima semana)'],
        confidence: 1
      };
    }

    // Verificar se é final de semana
    const dayOfWeek = inputDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isValid: false,
        issues: ['Não atendemos nos finais de semana'],
        suggestions: ['Escolha uma data entre segunda e sexta-feira'],
        confidence: 1
      };
    }

    return {
      isValid: true,
      value: selectedDate,
      issues: [],
      suggestions: [],
      confidence: 1
    };
  }
}
