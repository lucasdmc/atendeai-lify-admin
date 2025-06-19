
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TopicData {
  name: string;
  value: number;
}

interface TopicsChartProps {
  topicsData: TopicData[];
}

export const TopicsChart: React.FC<TopicsChartProps> = ({ topicsData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Principais Tópicos de Conversas</CardTitle>
        <CardDescription>
          Tópicos mais discutidos hoje baseados nas conversas do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topicsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="value" 
                fill="url(#gradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum tópico encontrado para hoje</p>
              <p className="text-sm">Conversas do WhatsApp aparecerão aqui</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
