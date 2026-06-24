import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../backend/db';
import { verifyAuth } from '../../backend/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return; // Response is handled in verifyAuth

  if (req.method === 'GET') {
    try {
      const patients = await prisma.patient.findMany({
        where: { nutritionistId: user.id },
        include: {
          records: {
            orderBy: { date: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return res.status(200).json(patients);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { rmNumber, name, dateOfBirth, gender, parentName, address } = req.body;
    
    if (!name || !dateOfBirth || !gender || !parentName || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const newPatient = await prisma.patient.create({
        data: {
          rmNumber,
          name,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          parentName,
          address,
          nutritionistId: user.id
        }
      });
      return res.status(201).json(newPatient);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}
