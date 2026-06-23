import whoData from './who-data.json';

export function calculateValueFromZScore(Z: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return M * Math.exp(Z * S);
  }
  return M * Math.pow(1 + L * S * Z, 1 / L);
}

export function calculateLMSZScore(measurement: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return Math.log(measurement / M) / S;
  }
  return (Math.pow(measurement / M, L) - 1) / (L * S);
}

// Generate the background curves for Age-based charts (0 to 60 months)
export function getAgeChartBands(gender: 'L' | 'P', type: 'WFA' | 'HFA' | 'BMI') {
  const isBoy = gender === 'L';
  const data: any[] = [];
  
  for (let month = 0; month <= 60; month++) {
    const ageKey = month.toString();
    let table: any;

    if (type === 'WFA') {
      table = isBoy ? whoData.wfa_boys : whoData.wfa_girls;
    } else if (type === 'HFA') {
      const table02 = isBoy ? whoData.hfa_boys_0_2 : whoData.hfa_girls_0_2;
      const table25 = isBoy ? whoData.hfa_boys_2_5 : whoData.hfa_girls_2_5;
      table = month <= 24 ? table02 : table25;
    } else if (type === 'BMI') {
      const table02 = isBoy ? whoData.bmi_boys_0_2 : whoData.bmi_girls_0_2;
      const table25 = isBoy ? whoData.bmi_boys_2_5 : whoData.bmi_girls_2_5;
      table = month <= 24 ? table02 : table25;
    }

    if (table && table[ageKey]) {
      const { L, M, S } = table[ageKey];
      data.push({
        x: month,
        sd3: calculateValueFromZScore(3, L, M, S),
        sd2: calculateValueFromZScore(2, L, M, S),
        sd1: calculateValueFromZScore(1, L, M, S),
        sd0: calculateValueFromZScore(0, L, M, S),
        sdMinus1: calculateValueFromZScore(-1, L, M, S),
        sdMinus2: calculateValueFromZScore(-2, L, M, S),
        sdMinus3: calculateValueFromZScore(-3, L, M, S),
      });
    }
  }
  return data;
}

// Generate background curves for Weight for Height (WFH)
// Height ranges roughly from 45cm to 120cm
export function getHeightChartBands(gender: 'L' | 'P') {
  const isBoy = gender === 'L';
  const data: any[] = [];
  
  // Combine 0-2 and 2-5 tables for a continuous plot
  const table02 = isBoy ? whoData.wfh_boys_0_2 : whoData.wfh_girls_0_2;
  const table25 = isBoy ? whoData.wfh_boys_2_5 : whoData.wfh_girls_2_5;
  
  // We'll just step through heights from 45.0 to 120.0
  for (let h = 450; h <= 1200; h += 5) {
    const height = h / 10;
    const heightKey = height.toString();
    
    // Prioritize 0-2 for shorter lengths, 2-5 for taller
    let table: any = height <= 87 ? table02 : table25;
    
    // If not found, try the other table
    if (!table[heightKey]) {
       table = table === table02 ? table25 : table02;
    }

    if (table[heightKey]) {
      const { L, M, S } = table[heightKey];
      data.push({
        x: height,
        sd3: calculateValueFromZScore(3, L, M, S),
        sd2: calculateValueFromZScore(2, L, M, S),
        sd1: calculateValueFromZScore(1, L, M, S),
        sd0: calculateValueFromZScore(0, L, M, S),
        sdMinus1: calculateValueFromZScore(-1, L, M, S),
        sdMinus2: calculateValueFromZScore(-2, L, M, S),
        sdMinus3: calculateValueFromZScore(-3, L, M, S),
      });
    }
  }
  return data;
}
