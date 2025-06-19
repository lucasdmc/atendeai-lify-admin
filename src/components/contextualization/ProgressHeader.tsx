
import { CheckCircle2, Sparkles } from 'lucide-react';

interface ProgressHeaderProps {
  questionsCompleted: boolean;
  progress: number;
  answeredQuestions: number;
  totalQuestions: number;
}

export const ProgressHeader = ({ 
  questionsCompleted, 
  progress, 
  answeredQuestions, 
  totalQuestions 
}: ProgressHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Contextualizar Chatbot</h1>
        <p className="text-gray-600 mt-2">Configure seu assistente virtual com informações da sua clínica</p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2 mb-2">
          {questionsCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-orange-500" />
          )}
          <p className="text-sm text-gray-500">
            {questionsCompleted ? 'Contextualização Completa ✨' : 'Progresso da Contextualização'}
          </p>
        </div>
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              questionsCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-pink-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {answeredQuestions}/{totalQuestions} perguntas respondidas ({progress}%)
        </p>
      </div>
    </div>
  );
};
