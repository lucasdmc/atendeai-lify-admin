import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}

const StatsCard = ({ title, value, icon: Icon, color, bgColor, shadowColor }: StatsCardProps) => {
  return (
    <Card className={`h-full group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${bgColor} ${shadowColor}`}>
      {/* Efeitos de fundo animados */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-700"></div>
      
      {/* Linha decorativa superior */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${color} bg-gradient-to-r from-transparent via-current to-transparent opacity-60`}></div>
      
      <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white/90 mb-2 tracking-wide uppercase">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-sm text-white/70 font-medium">
                {typeof value === 'number' && value === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </div>
          </div>
          
          {/* Ícone com efeito de brilho */}
          <div className={`p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg border border-white/30 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Icon className={`h-6 w-6 ${color} relative z-10`} />
          </div>
        </div>
        
        {/* Indicador de progresso decorativo */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                style={{ 
                  width: `${Math.min((typeof value === 'number' ? value : 0) * 10, 100)}%` 
                }}
              ></div>
            </div>
            <span className="text-xs text-white/60 font-medium">
              {Math.min((typeof value === 'number' ? value : 0) * 10, 100)}%
            </span>
          </div>
          
          {/* Status indicador */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} animate-pulse`}></div>
            <span className="text-xs text-white/80 font-medium">
              {typeof value === 'number' && value > 0 ? 'Ativo' : 'Pendente'}
            </span>
          </div>
        </div>
      </CardContent>
      
      {/* Efeito de borda brilhante no hover */}
      <div className={`absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none`}></div>
    </Card>
  );
};

export default StatsCard;
