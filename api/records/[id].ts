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

      // Real WHO Z-Score calculation
      let calcWFA = zScoreWFA || 0;
      let calcHFA = zScoreHFA || 0;
      let calcWFH = zScoreWFH || 0;
      let calcBMI = zScoreBMI || 0;

      try {
        const { Calculator, Patient } = whoGrowth as any;
        const calc = new Calculator();
        // Convert to months
        const diffTime = Math.abs(new Date(existingRecord.date).getTime() - new Date(existingRecord.patient.dateOfBirth).getTime());
        const ageInMonths = Math.floor(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 30.44);
        
        const child = new Patient(existingRecord.patient.gender === 'L' ? 1 : 2, ageInMonths);
        calcWFA = calc.weightForAge(child, parseFloat(weight));
        calcHFA = calc.lengthForAge(child, parseFloat(height));
        calcWFH = calc.weightForLength(child, parseFloat(weight), parseFloat(height));
        calcBMI = calc.bmiForAge(child, parseFloat(weight) / ((parseFloat(height)/100)*(parseFloat(height)/100)));
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
