import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../backend/db';
import { verifyAuth } from '../../backend/auth';
import { calculateAllZScores } from '../../backend/zscore-calculator';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const {
        date, weight, height, headCircum, lila, consultationNotes,
        zScoreWFA, zScoreHFA, zScoreWFH, zScoreBMI
      } = req.body;
      
      const existingRecord = await prisma.anthropometryRecord.findUnique({
        where: { id: id as string },
        include: { patient: true }
      });

      if (!existingRecord || existingRecord.patient.nutritionistId !== user.id) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // Real WHO Z-Score calculation using native LMS formula
      let calcWFA = zScoreWFA || 0;
      let calcHFA = zScoreHFA || 0;
      let calcWFH = zScoreWFH || 0;
      let calcBMI = zScoreBMI || 0;

      try {
        const recordDate = date ? new Date(date) : new Date(existingRecord.date);
        const diffTime = Math.abs(recordDate.getTime() - new Date(existingRecord.patient.dateOfBirth).getTime());
        const ageInMonths = Math.floor(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 30.44);
        
        const zScores = calculateAllZScores(
          existingRecord.patient.gender as 'L' | 'P',
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

      const updated = await prisma.anthropometryRecord.update({
        where: { id: id as string },
        data: {
          date: date ? new Date(date) : undefined,
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

  if (req.method === 'DELETE') {
    try {
      const existingRecord = await prisma.anthropometryRecord.findUnique({
        where: { id: id as string },
        include: { patient: true }
      });

      if (!existingRecord || existingRecord.patient.nutritionistId !== user.id) {
        return res.status(404).json({ error: 'Record not found' });
      }

      await prisma.anthropometryRecord.delete({
        where: { id: id as string }
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete record' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
