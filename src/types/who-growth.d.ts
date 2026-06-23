declare module 'who-growth' {
  export class Patient {
    constructor(data: {
      name: string;
      birthDate: string;
      weight: number;
      height: number;
      sex: 'Male' | 'Female';
      bmi?: number;
    });
  }

  export class Calculator {
    static load(type: 'ZScore' | 'Percentile', patient: Patient): Calculator;
    calculateWeightForAge(): string | number;
    calculateHeightForAge(): string | number;
    calculateWeightForHeight(): string | number;
    calculateBMIForAge(): string | number;
  }
}
