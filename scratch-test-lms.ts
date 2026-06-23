import fs from 'fs';

const whoData = JSON.parse(fs.readFileSync('./api/utils/who-data.json', 'utf8'));

function calculateValueFromZScore(Z: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return M * Math.exp(Z * S);
  }
  return M * Math.pow(1 + L * S * Z, 1 / L);
}

// Test wfa_boys at 12 months
const month12 = whoData.wfa_boys['12'];
console.log('Month 12 LMS:', month12);
console.log('Median (Z=0):', calculateValueFromZScore(0, month12.L, month12.M, month12.S));
console.log('+2 SD (Z=2):', calculateValueFromZScore(2, month12.L, month12.M, month12.S));
console.log('-2 SD (Z=-2):', calculateValueFromZScore(-2, month12.L, month12.M, month12.S));
