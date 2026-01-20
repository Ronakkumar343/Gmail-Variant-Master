import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, CartesianGrid } from 'recharts';
import { VariationResult } from '../types';

interface StatsPanelProps {
  variations: VariationResult[];
  originalEmail: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ variations, originalEmail }) => {
  // Calculate distribution of dot counts
  const data = React.useMemo(() => {
    if (!variations.length) return [];
    
    const counts: Record<number, number> = {};
    variations.forEach(v => {
      const [local] = v.email.split('@');
      const dots = (local.match(/\./g) || []).length;
      counts[dots] = (counts[dots] || 0) + 1;
    });

    return Object.entries(counts).map(([dots, count]) => ({
      name: `${dots} Dots`,
      dots: Number(dots),
      count
    })).sort((a,b) => a.dots - b.dots);
  }, [variations]);

  const maxCount = Math.max(...data.map(d => d.count), 0);
  const baseLength = originalEmail.includes('@') 
    ? originalEmail.split('@')[0].replace(/\./g, '').length 
    : 'N/A';

  if (variations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors h-auto flex flex-col w-full">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Distribution Analysis</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <p className="text-xs text-primary-600 dark:text-primary-300 uppercase font-semibold">Base Length</p>
          <p className="text-2xl font-bold text-primary-700 dark:text-primary-100">{baseLength} chars</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-300 uppercase font-semibold">Total Generated</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-100">{variations.length}</p>
        </div>
      </div>

      <div className="relative w-full h-[250px] min-w-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false}
                interval="preserveStartEnd" 
              />
              <YAxis 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{fill: 'transparent'}}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count === maxCount ? '#0ea5e9' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Not enough data for chart
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Frequency of dot occurrences per alias</p>
    </div>
  );
};