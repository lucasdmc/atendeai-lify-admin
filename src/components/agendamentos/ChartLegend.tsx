
interface ChartLegendProps {
  payload?: any[];
}

const ChartLegend = ({ payload }: ChartLegendProps) => {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div 
            className="w-3 h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default ChartLegend;
