import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userAuth = verifyAuth(req, res);
  if (!userAuth) return; // Response handled in verifyAuth

  if (req.method === 'GET') {
    try {
      const user = await prisma.nutritionist.findUnique({
        where: { id: userAuth.id },
        select: { name: true, clinic: true, rmPrefix: true }
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, clinic, rmPrefix } = req.body;
      const updatedUser = await prisma.nutritionist.update({
        where: { id: userAuth.id },
        data: {
          name: name ?? undefined,
          clinic: clinic ?? undefined,
          rmPrefix: rmPrefix ?? undefined
        },
        select: { id: true, name: true, clinic: true, rmPrefix: true, email: true }
      });
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
