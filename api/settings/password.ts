import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db.js';
import { verifyAuth } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userAuth = verifyAuth(req, res);
  if (!userAuth) return;

  if (req.method === 'PUT') {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing password fields' });
      }

      const user = await prisma.nutritionist.findUnique({
        where: { id: userAuth.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.password !== oldPassword) {
        return res.status(401).json({ error: 'Password lama salah' });
      }

      await prisma.nutritionist.update({
        where: { id: user.id },
        data: { password: newPassword }
      });

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
