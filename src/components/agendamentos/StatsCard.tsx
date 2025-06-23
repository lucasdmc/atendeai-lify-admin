
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}

const StatsCard = ({ title, value, icon: Icon, color, bgColor, borderColor, shadowColor }: StatsCardProps) => {
  return (
    <Card className={`h-full hover:shadow-lg transition-all duration-300 border ${borderColor} ${bgColor} hover:scale-102 ${shadowColor} relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-300"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6 group-hover:scale-110 transition-transform duration-300"></div>
      <CardContent className="p-4 relative z-10 h-full flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-white/90 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
          <p className="text-xs text-white/80">
            {value === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-md border border-white/30 group-hover:bg-white/30 transition-all duration-300">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
