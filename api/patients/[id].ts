import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const patient = await prisma.patient.findFirst({
        where: { id: id as string, nutritionistId: user.id },
        include: {
          records: {
            orderBy: { date: 'desc' }
          }
        }
      });
      
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      return res.status(200).json(patient);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch patient' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { rmNumber, name, dateOfBirth, gender, parentName, address } = req.body;
      
      const existing = await prisma.patient.findFirst({
        where: { id: id as string, nutritionistId: user.id }
      });

      if (!existing) return res.status(404).json({ error: 'Patient not found' });

      const updated = await prisma.patient.update({
        where: { id: id as string },
        data: {
          rmNumber,
          name,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          parentName,
          address
        }
      });

      return res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update patient' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
