
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
    <Card className={`hover:shadow-2xl transition-all duration-500 border-2 ${borderColor} ${bgColor} hover:scale-105 ${shadowColor} relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-500"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/90 mb-2">{title}</p>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-white/80">
              {value === 1 ? 'agendamento' : 'agendamentos'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg border border-white/30 group-hover:bg-white/30 transition-all duration-300">
            <Icon className={`h-7 w-7 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
