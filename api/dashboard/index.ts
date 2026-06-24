import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../backend/db.js';
import { verifyAuth } from '../../backend/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return; // Response is handled in verifyAuth

  if (req.method === 'GET') {
    try {
      // 1. Total Patients
      const totalPatients = await prisma.patient.count({
        where: { nutritionistId: user.id }
      });

      // 2. Visits Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const visitsToday = await prisma.anthropometryRecord.count({
        where: {
          patient: { nutritionistId: user.id },
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      // 3. Needs Intervention (Gizi Buruk: Z-Score WFA < -3 or WFH < -3)
      // Since prisma doesn't easily support querying latest record for each patient in a single simple query,
      // we can fetch all patients with their latest record and count in memory, which is fast enough for now.
      const patients = await prisma.patient.findMany({
        where: { nutritionistId: user.id },
        include: {
          records: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });

      let interventionCount = 0;
      for (const p of patients) {
        if (p.records.length > 0) {
          const latest = p.records[0];
          // Gizi Buruk or Sangat Pendek or Severely Wasted
          if (
            (latest.zScoreWFA !== null && latest.zScoreWFA < -3) ||
            (latest.zScoreHFA !== null && latest.zScoreHFA < -3) ||
            (latest.zScoreWFH !== null && latest.zScoreWFH < -3)
          ) {
            interventionCount++;
          }
        }
      }

      return res.status(200).json({
        totalPatients,
        visitsToday,
        interventionCount
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end('Method Not Allowed');
}
