import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

interface GrowthChartProps {
  data: Array<{ ageMonths: number; weight: number; height: number }>;
  type: 'BB/U' | 'TB/U' | 'BB/TB';
}

export default function GrowthChart({ data, type }: GrowthChartProps) {
  // Mock standard curve data (in reality this would be 0, -2SD, -3SD, +2SD, +3SD for each month)
  const chartData = [0, 6, 12, 18, 24].map(month => {
    const record = data.find(d => d.ageMonths === month);
    return {
      month,
      actualWeight: record?.weight || null,
      actualHeight: record?.height || null,
      medianWeight: month * 0.8 + 3, // Mock formula
      sd2Weight: month * 0.8 + 4.5,
      sdMinus2Weight: month * 0.8 + 1.5,
      medianHeight: month * 2.5 + 50,
      sd2Height: month * 2.5 + 55,
      sdMinus2Height: month * 2.5 + 45,
    };
  });

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" label={{ value: 'Usia (Bulan)', position: 'insideBottom', offset: -10 }} />
          
          {type === 'BB/U' && (
            <>
              <YAxis label={{ value: 'Berat Badan (kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Line type="monotone" dataKey="sd2Weight" stroke="#DC2626" strokeDasharray="5 5" name="+2 SD" dot={false} />
              <Line type="monotone" dataKey="medianWeight" stroke="#16A34A" name="Median" dot={false} />
              <Line type="monotone" dataKey="sdMinus2Weight" stroke="#DC2626" strokeDasharray="5 5" name="-2 SD" dot={false} />
              <Line type="monotone" dataKey="actualWeight" stroke="#0891B2" strokeWidth={3} name="Berat Anak" activeDot={{ r: 8 }} />
            </>
          )}

          {type === 'TB/U' && (
            <>
              <YAxis label={{ value: 'Tinggi Badan (cm)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Line type="monotone" dataKey="sd2Height" stroke="#DC2626" strokeDasharray="5 5" name="+2 SD" dot={false} />
              <Line type="monotone" dataKey="medianHeight" stroke="#16A34A" name="Median" dot={false} />
              <Line type="monotone" dataKey="sdMinus2Height" stroke="#DC2626" strokeDasharray="5 5" name="-2 SD" dot={false} />
              <Line type="monotone" dataKey="actualHeight" stroke="#0891B2" strokeWidth={3} name="Tinggi Anak" activeDot={{ r: 8 }} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
