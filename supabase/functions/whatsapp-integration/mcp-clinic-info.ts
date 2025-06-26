
// Clinic information provider for MCP tools
export class MCPClinicInfo {
  static async getClinicInfo(parameters: any): Promise<string> {
    const { info_type } = parameters;
    
    switch (info_type) {
      case 'horarios':
        return `📅 **Horários de Funcionamento:**
🕐 Segunda a Sexta: 8h às 18h
🕐 Sábado: 8h às 12h
❌ Domingo: Fechado

Precisa agendar? Me avisa que te ajudo! 😊💙`;
      case 'especialidades':
        return `👨‍⚕️ **Nossas Especialidades:**
• Clínica Geral
• Cardiologia
• Psicologia
• Dermatologia
• Ginecologia
• Pediatria

Qual você precisa? 😊💙`;
      case 'localizacao':
        return `📍 **Nossa Localização:**
Estamos localizados no centro da cidade, com fácil acesso e estacionamento.

Precisa do endereço exato? Nossa equipe pode te passar! 😊💙`;
      default:
        return `🏥 **Sobre Nossa Clínica:**
Somos uma clínica completa com diversas especialidades!
📅 Atendemos de segunda a sexta, das 8h às 18h
👨‍⚕️ Temos profissionais qualificados

Em que posso te ajudar especificamente? 😊💙`;
    }
  }
}
