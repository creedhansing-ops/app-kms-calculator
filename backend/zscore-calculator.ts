import whoData from './who-data';

export function calculateLMSZScore(measurement: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return Math.log(measurement / M) / S;
  }
  return (Math.pow(measurement / M, L) - 1) / (L * S);
}

export function calculateAllZScores(
  gender: 'L' | 'P',
  ageInMonths: number,
  weight: number,
  height: number
) {
  const isBoy = gender === 'L';
  let zWFA = 0, zHFA = 0, zWFH = 0, zBMI = 0;
  
  const ageKey = ageInMonths.toString();
  const heightKey = Math.round(height * 10) / 10; // usually in steps of 0.5 or 0.1
  const heightKeyStr = heightKey.toString();

  type TableType = Record<string, {L: number, M: number, S: number}>;

  // WFA
  const wfaTable: TableType = (isBoy ? whoData.wfa_boys : whoData.wfa_girls) as TableType;
  if (wfaTable[ageKey]) {
    const { L, M, S } = wfaTable[ageKey];
    zWFA = calculateLMSZScore(weight, L, M, S);
  }

  // HFA
  const hfaTable: TableType = (ageInMonths <= 24 
    ? (isBoy ? whoData.hfa_boys_0_2 : whoData.hfa_girls_0_2)
    : (isBoy ? whoData.hfa_boys_2_5 : whoData.hfa_girls_2_5)) as TableType;
  if (hfaTable[ageKey]) {
    const { L, M, S } = hfaTable[ageKey];
    zHFA = calculateLMSZScore(height, L, M, S);
  }

  // WFH (Weight for Height/Length)
  const wfhTable: TableType = (ageInMonths <= 24
    ? (isBoy ? whoData.wfh_boys_0_2 : whoData.wfh_girls_0_2)
    : (isBoy ? whoData.wfh_boys_2_5 : whoData.wfh_girls_2_5)) as TableType;
  // Find closest height key
  let bestHeightKey = heightKeyStr;
  if (!wfhTable[bestHeightKey]) {
    const sortedKeys = Object.keys(wfhTable).map(Number).sort((a,b) => a-b);
    const closest = sortedKeys.reduce((a, b) => Math.abs(b - height) < Math.abs(a - height) ? b : a);
    bestHeightKey = closest.toString();
  }
  if (wfhTable[bestHeightKey]) {
    const { L, M, S } = wfhTable[bestHeightKey];
    zWFH = calculateLMSZScore(weight, L, M, S);
  }

  // BMI
  const bmiTable: TableType = (ageInMonths <= 24
    ? (isBoy ? whoData.bmi_boys_0_2 : whoData.bmi_girls_0_2)
    : (isBoy ? whoData.bmi_boys_2_5 : whoData.bmi_girls_2_5)) as TableType;
  const bmiVal = weight / ((height / 100) * (height / 100));
  if (bmiTable[ageKey]) {
    const { L, M, S } = bmiTable[ageKey];
    zBMI = calculateLMSZScore(bmiVal, L, M, S);
  }

  return {
    calcWFA: zWFA,
    calcHFA: zHFA,
    calcWFH: zWFH,
    calcBMI: zBMI
  };
}
