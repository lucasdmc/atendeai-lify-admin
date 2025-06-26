
// MCP Tools Processor - Main orchestrator for MCP tool integration
import { MCPAvailabilityChecker } from './mcp-availability-checker.ts';
import { MCPAppointmentScheduler } from './mcp-appointment-scheduler.ts';
import { MCPClinicInfo } from './mcp-clinic-info.ts';
import { MCPToolsDefinitions } from './mcp-tools-definitions.ts';

export class MCPToolsProcessor {
  static async processToolCall(toolName: string, parameters: any, supabase: any): Promise<string> {
    console.log(`🔧 Processando ferramenta MCP: ${toolName}`);
    console.log(`📋 Parâmetros recebidos:`, JSON.stringify(parameters, null, 2));
    
    try {
      switch (toolName) {
        case 'check_availability':
          return await MCPAvailabilityChecker.checkAvailability(parameters, supabase);
        case 'schedule_appointment':
          return await MCPAppointmentScheduler.scheduleAppointment(parameters, supabase);
        case 'get_clinic_info':
          return await MCPClinicInfo.getClinicInfo(parameters);
        default:
          console.log(`⚠️ Ferramenta não reconhecida: ${toolName}`);
          return `Ferramenta ${toolName} não reconhecida.`;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ferramenta ${toolName}:`, error);
      return `Erro ao processar ${toolName}: ${error.message}`;
    }
  }

  static getMCPTools(): any[] {
    return MCPToolsDefinitions.getMCPTools();
  }
}
