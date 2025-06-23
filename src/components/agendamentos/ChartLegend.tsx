
interface ChartLegendProps {
  payload?: any[];
}

const ChartLegend = ({ payload }: ChartLegendProps) => {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default ChartLegend;
