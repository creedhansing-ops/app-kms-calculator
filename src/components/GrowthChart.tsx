import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getAgeChartBands, getHeightChartBands } from '../utils/who-calculator';

interface DetailedGrowthChartProps {
  gender: 'L' | 'P';
  type: 'WFA' | 'HFA' | 'WFH' | 'BMI';
  records: Array<{ ageMonths: number; weight: number; height: number }>;
}

export default function GrowthChart({ gender, type, records }: DetailedGrowthChartProps) {
  // 1. Generate WHO Standard Bands
  const bandsData = type === 'WFH' 
    ? getHeightChartBands(gender) 
    : getAgeChartBands(gender, type);

  // 2. Map actual child records to the same coordinate system
  const childDataPoints = records.map(r => {
    const xVal = type === 'WFH' ? Math.round(r.height * 10) / 10 : r.ageMonths;
    let yVal = 0;
    if (type === 'WFA' || type === 'WFH') yVal = r.weight;
    else if (type === 'HFA') yVal = r.height;
    else if (type === 'BMI') {
      const hMeters = r.height / 100;
      yVal = r.weight / (hMeters * hMeters);
    }
    return { x: xVal, actualValue: yVal };
  });

  // 3. Merge bands data with child actual records
  const mergedData: any[] = [...bandsData];

  // Simply add all child data points as independent objects in the mergedData array.
  // Recharts handles multiple objects with the same X value perfectly!
  childDataPoints.forEach(cp => {
    mergedData.push({
      x: cp.x,
      actualValue: cp.actualValue,
    });
  });

  // Sort by X so lines draw left to right
  mergedData.sort((a, b) => a.x - b.x);

  let xAxisLabel = 'Umur (Bulan)';
  let yAxisLabel = '';
  if (type === 'WFA') yAxisLabel = 'Berat Badan (kg)';
  if (type === 'HFA') yAxisLabel = 'Tinggi Badan (cm)';
  if (type === 'WFH') {
    xAxisLabel = 'Tinggi Badan (cm)';
    yAxisLabel = 'Berat Badan (kg)';
  }
  if (type === 'BMI') yAxisLabel = 'Indeks Masa Tubuh';

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart data={mergedData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }} 
          />
          <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'actualValue') return [value.toFixed(2), 'Nilai Anak'];
              return [value.toFixed(2), name];
            }}
            labelFormatter={(label) => `${xAxisLabel}: ${label}`}
          />

          {/* Standard Deviation Bands */}
          <Line type="monotone" dataKey="sd3" stroke="#DC2626" strokeWidth={1.5} dot={false} name="+3 SD" connectNulls />
          <Line type="monotone" dataKey="sd2" stroke="#F97316" strokeWidth={1.5} dot={false} name="+2 SD" connectNulls />
          <Line type="monotone" dataKey="sd1" stroke="#EAB308" strokeWidth={1.5} dot={false} name="+1 SD" connectNulls />
          
          <Line type="monotone" dataKey="sd0" stroke="#16A34A" strokeWidth={2} dot={false} name="Median" connectNulls />
          
          <Line type="monotone" dataKey="sdMinus1" stroke="#EAB308" strokeWidth={1.5} dot={false} name="-1 SD" connectNulls />
          <Line type="monotone" dataKey="sdMinus2" stroke="#F97316" strokeWidth={1.5} dot={false} name="-2 SD" connectNulls />
          <Line type="monotone" dataKey="sdMinus3" stroke="#DC2626" strokeWidth={1.5} dot={false} name="-3 SD" connectNulls />

          {/* Actual Child Data Points */}
          <Line 
            type="monotone" 
            dataKey="actualValue" 
            stroke="#000000" 
            strokeWidth={2} 
            dot={{ r: 4, fill: '#000000' }} 
            activeDot={{ r: 6 }} 
            name="actualValue" 
            connectNulls 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
