
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
    <Card className="hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm border border-white/20 hover:scale-105 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-lify-pink/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-lify-purple/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-500"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent mb-1">{value}</p>
            <p className="text-xs text-gray-500">
              {value === 1 ? 'agendamento' : 'agendamentos'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-lify-pink/10 to-lify-purple/10 backdrop-blur-sm shadow-lg border border-lify-pink/20 group-hover:from-lify-pink/20 group-hover:to-lify-purple/20 transition-all duration-300">
            <Icon className="h-7 w-7 text-lify-pink" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
