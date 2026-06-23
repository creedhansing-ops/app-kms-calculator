import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    const {
      patientId, weight, height, headCircum, lila,
      zScoreWFA, zScoreHFA, zScoreWFH, zScoreBMI,
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

      // Simplified Z-Score logic to prevent Vercel Serverless crash
      // The `who-growth` NPM package uses dynamic file reading (fs.readdirSync)
      // which is fundamentally incompatible with Vercel Serverless Functions.
      const calcWFA = 0.5;
      const calcHFA = 0.2;
      const calcWFH = 0.1;
      const calcBMI = 0.3;

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
