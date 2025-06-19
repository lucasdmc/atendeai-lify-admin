
export const whatsappLogger = {
  info: (message: string, data?: any) => {
    console.log(`🔥 ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`🔥 ERROR: ${message}`, error);
  },
  
  step: (stepNumber: number, message: string, data?: any) => {
    console.log(`🔥 Step ${stepNumber}: ${message}`, data || '');
  }
};
