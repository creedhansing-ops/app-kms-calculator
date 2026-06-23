import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db';
import { verifyAuth } from '../utils/auth';

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

      // Simple fallbacks for Z-Scores for now
      let calcWFA = zScoreWFA || 0;
      let calcHFA = zScoreHFA || 0;
      let calcWFH = zScoreWFH || 0;
      let calcBMI = zScoreBMI || 0;

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
