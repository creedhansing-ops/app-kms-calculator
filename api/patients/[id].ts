import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_utils/db.js';
import { verifyAuth } from '../_utils/auth.js';

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

  if (req.method === 'DELETE') {
    try {
      const existing = await prisma.patient.findFirst({
        where: { id: id as string, nutritionistId: user.id }
      });

      if (!existing) return res.status(404).json({ error: 'Patient not found' });

      // Automatically cascades records if schema supports it, but just in case:
      await prisma.anthropometryRecord.deleteMany({
        where: { patientId: id as string }
      });

      await prisma.patient.delete({
        where: { id: id as string }
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete patient' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
