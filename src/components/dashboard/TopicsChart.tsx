
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, MessageCircle } from 'lucide-react';

interface TopicData {
  name: string;
  value: number;
}

interface TopicsChartProps {
  topicsData: TopicData[];
}

const COLORS = [
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
];

export const TopicsChart: React.FC<TopicsChartProps> = ({ topicsData }) => {
  return (
    <Card className="shadow-lg border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <MessageCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              Principais Tópicos de Conversas
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Tópicos mais discutidos hoje baseados nas conversas do WhatsApp
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {topicsData.length > 0 ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topicsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {topicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topicsData.map((topic, index) => (
                <div key={topic.name} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{topic.name}</p>
                    <p className="text-xs text-gray-500">{topic.value} menções</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-2">Nenhum tópico encontrado para hoje</p>
              <p className="text-sm text-gray-500">Conversas do WhatsApp aparecerão aqui quando houver atividade</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
