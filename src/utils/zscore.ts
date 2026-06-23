export type Gender = 'L' | 'P';

export function calculateZScores(
  name: string,
  dob: Date,
  visitDate: Date,
  weight: number,
  height: number,
  gender: Gender
) {
  // Frontend calculation removed to prevent Vite bundling error with XLSX.
  // Real calculation is now done securely on the Vercel Backend Server using who-growth.
  return {
    zScoreWFA: 0,
    zScoreHFA: 0,
    zScoreWFH: 0,
    zScoreBMI: 0
  };
}

export function evaluateWFA(zScore: number): string {
  if (zScore < -3) return 'Berat Badan Sangat Kurang';
  if (zScore < -2) return 'Berat Badan Kurang';
  if (zScore <= 1) return 'Berat Badan Normal';
  return 'Risiko Berat Badan Lebih';
}

export function evaluateHFA(zScore: number): string {
  if (zScore < -3) return 'Sangat Pendek (Severely Stunted)';
  if (zScore < -2) return 'Pendek (Stunted)';
  if (zScore <= 3) return 'Normal';
  return 'Tinggi';
}

export function evaluateWFH(zScore: number): string {
  if (zScore < -3) return 'Gizi Buruk (Severely Wasted)';
  if (zScore < -2) return 'Gizi Kurang (Wasted)';
  if (zScore <= 1) return 'Gizi Baik (Normal)';
  if (zScore <= 2) return 'Berisiko Gizi Lebih';
  if (zScore <= 3) return 'Gizi Lebih (Overweight)';
  return 'Obesitas (Obese)';
}

export function evaluateBMI(zScore: number): string {
  if (zScore < -3) return 'Sangat Kurus';
  if (zScore < -2) return 'Kurus';
  if (zScore <= 1) return 'Normal';
  if (zScore <= 2) return 'Overweight';
  return 'Obesitas';
}

// Calculate age in months
export function getAgeInMonths(birthDate: Date, visitDate: Date = new Date()) {
  const diffTime = Math.abs(visitDate.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 30.44); // approximate months
}

export function formatAge(months: number): string {
  if (months < 12) {
    return `${months} Bulan`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} Tahun`;
  }
  return `${years} Tahun ${remainingMonths} Bulan`;
}
