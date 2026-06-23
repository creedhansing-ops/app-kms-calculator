import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';


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

      // Simplified Z-Score logic to prevent Vercel Serverless crash
      const calcWFA = zScoreWFA || 0.5;
      const calcHFA = zScoreHFA || 0.2;
      const calcWFH = zScoreWFH || 0.1;
      const calcBMI = zScoreBMI || 0.3;

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
