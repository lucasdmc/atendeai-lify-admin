
// ========================================
// ESTRUTURA JSON PADRÃO DA CLÍNICA
// ========================================

export const CLINIC_SCHEMA = {
  // Informações básicas
  id: "clinic_001",
  name: "CardioPrime",
  specialty: "Cardiologia",
  
  // Equipe médica
  doctors: [
    {
      id: "dr_001",
      name: "Dr. João Silva",
      specialty: "Cardiologia Clínica",
      crm: "12345-SP",
      schedule: {
        monday: ["08:00-12:00", "14:00-18:00"],
        tuesday: ["08:00-12:00", "14:00-18:00"],
        wednesday: ["08:00-12:00"],
        thursday: ["08:00-12:00", "14:00-18:00"],
        friday: ["08:00-12:00", "14:00-17:00"],
        saturday: [],
        sunday: []
      },
      bio: "Especialista em insuficiência cardíaca com 15 anos de experiência"
    },
    {
      id: "dr_002",
      name: "Dra. Maria Oliveira",
      specialty: "Cardiologia Intervencionista",
      crm: "67890-SP",
      schedule: {
        monday: ["14:00-18:00"],
        tuesday: ["08:00-12:00", "14:00-18:00"],
        wednesday: ["08:00-12:00", "14:00-18:00"],
        thursday: ["08:00-12:00"],
        friday: ["08:00-12:00", "14:00-17:00"],
        saturday: ["08:00-12:00"],
        sunday: []
      },
      bio: "Especialista em arritmias e procedimentos invasivos"
    }
  ],
  
  // Horários de funcionamento
  schedule: {
    monday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    tuesday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    wednesday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    thursday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    friday: { open: "08:00", close: "17:00", lunch: "12:00-14:00" },
    saturday: { open: "08:00", close: "12:00", lunch: null },
    sunday: { open: null, close: null, lunch: null }
  },
  
  // Serviços oferecidos
  services: [
    {
      id: "service_001",
      name: "Consulta Cardiológica",
      duration: "30 minutos",
      price: "R$ 250,00",
      description: "Avaliação completa do sistema cardiovascular"
    },
    {
      id: "service_002",
      name: "Eletrocardiograma (ECG)",
      duration: "15 minutos",
      price: "R$ 80,00",
      description: "Exame para avaliar atividade elétrica do coração"
    },
    {
      id: "service_003",
      name: "Ecocardiograma",
      duration: "45 minutos",
      price: "R$ 350,00",
      description: "Ultrassom do coração para avaliar estrutura e função"
    },
    {
      id: "service_004",
      name: "Teste Ergométrico",
      duration: "60 minutos",
      price: "R$ 400,00",
      description: "Avaliação do coração durante exercício físico"
    }
  ],
  
  // Localização e contato
  location: {
    address: "Rua das Flores, 123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    coordinates: { lat: -23.5505, lng: -46.6333 }
  },
  
  contact: {
    phone: "+55 11 3456-7890",
    whatsapp: "+55 11 99876-5432",
    email: "contato@cardioprime.com.br",
    website: "https://cardioprime.com.br"
  },
  
  // Políticas e informações importantes
  policies: {
    cancellation: "Cancelamentos devem ser feitos com 24h de antecedência",
    lateness: "Tolerância de 15 minutos de atraso",
    payment: "Aceitamos dinheiro, cartão e PIX",
    insurance: "Convênios: Unimed, Bradesco Saúde, SulAmérica",
    parking: "Estacionamento gratuito disponível"
  },
  
  // Configurações do assistente
  assistant: {
    name: "Dr. Carlos",
    personality: "Acolhedor, profissional e empático",
    greeting: "Olá! Sou o Dr. Carlos, assistente virtual da CardioPrime. Como posso ajudar você hoje?",
    capabilities: [
      "Informações sobre médicos e especialidades",
      "Horários de funcionamento",
      "Serviços oferecidos",
      "Orientações para agendamento",
      "Localização e contato"
    ],
    limitations: [
      "Não posso dar conselhos médicos",
      "Não posso agendar consultas diretamente",
      "Para emergências, procure atendimento médico imediato"
    ]
  }
};

export default CLINIC_SCHEMA;
