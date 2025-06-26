
// MCP tools definitions and schema
export class MCPToolsDefinitions {
  static getMCPTools(): any[] {
    return [
      {
        type: "function",
        function: {
          name: "check_availability",
          description: "Verificar disponibilidade de horários na clínica para agendamentos",
          parameters: {
            type: "object",
            properties: {
              specialty: {
                type: "string",
                description: "Especialidade médica desejada (ex: cardiologia, psicologia)"
              },
              date: {
                type: "string",
                description: "Data preferida para consulta (formato DD/MM/AAAA)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "schedule_appointment",
          description: "Agendar uma consulta médica real no sistema",
          parameters: {
            type: "object",
            properties: {
              specialty: {
                type: "string",
                description: "Especialidade médica"
              },
              date: {
                type: "string",
                description: "Data da consulta (formato DD/MM/AAAA)"
              },
              time: {
                type: "string",
                description: "Horário da consulta (formato HH:MM)"
              },
              customerName: {
                type: "string",
                description: "Nome completo do paciente"
              },
              customerEmail: {
                type: "string",
                description: "Email do paciente para confirmação"
              }
            },
            required: ["specialty", "date", "time"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_clinic_info",
          description: "Obter informações sobre a clínica (horários, especialidades, localização)",
          parameters: {
            type: "object",
            properties: {
              info_type: {
                type: "string",
                description: "Tipo de informação (horarios, especialidades, localizacao, geral)",
                enum: ["horarios", "especialidades", "localizacao", "geral"]
              }
            }
          }
        }
      }
    ];
  }
}
