import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';
import { calculateAllZScores } from '../utils/zscore-calculator';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    const {
      patientId, weight, height, headCircum, lila,
      consultationNotes, diagnosis, intervention, target, nextVisit
    } = req.body;

    if (!patientId || weight === undefined || height === undefined) {
      return res.status(400).json({ error: 'Missing required anthropometry fields' });
    }

    try {
      // Verify patient belongs to nutritionist
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, nutritionistId: user.id }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Real WHO Z-Score calculation using native LMS formula
      let calcWFA = 0, calcHFA = 0, calcWFH = 0, calcBMI = 0;
      try {
        const recordDate = req.body.date ? new Date(req.body.date) : new Date();
        const diffTime = Math.abs(recordDate.getTime() - new Date(patient.dateOfBirth).getTime());
        const ageInMonths = Math.floor(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 30.44);
        
        const zScores = calculateAllZScores(
          patient.gender as 'L' | 'P',
          ageInMonths,
          parseFloat(weight),
          parseFloat(height)
        );
        calcWFA = zScores.calcWFA;
        calcHFA = zScores.calcHFA;
        calcWFH = zScores.calcWFH;
        calcBMI = zScores.calcBMI;
      } catch (e) {
        console.error('WHO calculation failed:', e);
      }

      const record = await prisma.anthropometryRecord.create({
        data: {
          patientId,
          weight: parseFloat(weight),
          height: parseFloat(height),
          headCircum: headCircum ? parseFloat(headCircum) : null,
          lila: lila ? parseFloat(lila) : null,
          zScoreWFA: typeof calcWFA === 'number' ? calcWFA : null,
          zScoreHFA: typeof calcHFA === 'number' ? calcHFA : null,
          zScoreWFH: typeof calcWFH === 'number' ? calcWFH : null,
          zScoreBMI: typeof calcBMI === 'number' ? calcBMI : null,
          consultationNotes,
          diagnosis,
          intervention,
          target,
          nextVisit: nextVisit ? new Date(nextVisit) : null,
        }
      });

      return res.status(201).json(record);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end('Method Not Allowed');
}
