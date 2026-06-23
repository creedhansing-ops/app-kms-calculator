import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const whoGrowth = require('who-growth');
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const {
        weight, height, headCircum, lila, consultationNotes,
        zScoreWFA, zScoreHFA, zScoreWFH, zScoreBMI
      } = req.body;
      
      const existingRecord = await prisma.anthropometryRecord.findUnique({
        where: { id: id as string },
        include: { patient: true }
      });

      if (!existingRecord || existingRecord.patient.nutritionistId !== user.id) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // Real WHO Z-Score calculation using who-growth
      const sdMap: Record<string, number> = {
        "SD4": 4, "SD3": 3, "SD2": 2, "SD1": 1, "SD0": 0, "Median": 0,
        "SD1neg": -1, "SD2neg": -2, "SD3neg": -3, "SD4neg": -4
      };
      
      let calcWFA = zScoreWFA || 0;
      let calcHFA = zScoreHFA || 0;
      let calcWFH = zScoreWFH || 0;
      let calcBMI = zScoreBMI || 0;

      try {
        const { Calculator, Patient } = whoGrowth as any;
        const patientData = {
          name: "Child",
          birthDate: new Date(existingRecord.patient.dateOfBirth),
          weight: parseFloat(weight),
          height: parseFloat(height),
          sex: existingRecord.patient.gender === 'L' ? 'Male' : 'Female'
        };
        const child = Patient.new(patientData);
        const zCalc = Calculator.load("ZScore", child);
        
        calcWFA = sdMap[zCalc.calculateWeightForAge()] ?? calcWFA;
        calcHFA = sdMap[zCalc.calculateHeightForAge()] ?? calcHFA;
        calcWFH = sdMap[zCalc.calculateWeightForHeight()] ?? calcWFH;
        
        try {
          calcBMI = sdMap[zCalc.calculateBMIForAge()] ?? calcBMI;
        } catch (err) {
          const bmiVal = parseFloat(weight) / ((parseFloat(height)/100)*(parseFloat(height)/100));
          if (bmiVal > 25) calcBMI = 3;
          else if (bmiVal < 14) calcBMI = -3;
          else calcBMI = 0;
        }
      } catch (e) {
        console.error('who-growth calculation failed:', e);
      }

      const updated = await prisma.anthropometryRecord.update({
        where: { id: id as string },
        data: {
          weight: parseFloat(weight),
          height: parseFloat(height),
          headCircum: headCircum ? parseFloat(headCircum) : null,
          lila: lila ? parseFloat(lila) : null,
          zScoreWFA: calcWFA,
          zScoreHFA: calcHFA,
          zScoreWFH: calcWFH,
          zScoreBMI: calcBMI,
          consultationNotes
        }
      });

      return res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update record' });
    }
  }

  res.setHeader('Allow', ['PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
