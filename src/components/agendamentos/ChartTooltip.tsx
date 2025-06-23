
interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
}

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-lify-pink/20 rounded-xl shadow-2xl">
        <p className="font-bold text-gray-800 text-lg">{`${payload[0].name}: ${payload[0].value}`}</p>
        <p className="text-sm text-gray-600 mt-1">
          {payload[0].value === 1 ? 'agendamento' : 'agendamentos'}
        </p>
        <div 
          className="w-4 h-4 rounded-full mt-2 mx-auto border-2 border-white shadow-md"
          style={{ backgroundColor: payload[0].payload.color }}
        />
      </div>
    );
  }
  return null;
};

export default ChartTooltip;
