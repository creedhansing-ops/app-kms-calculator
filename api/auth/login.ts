import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia-kms-2026';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email, password } = req.body;

    const user = await prisma.nutritionist.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Support both plaintext (for seed) and bcrypt
    const isPlaintextMatch = password === user.password;
    let isBcryptMatch = false;
    
    if (!isPlaintextMatch) {
      try {
        isBcryptMatch = await bcrypt.compare(password, user.password);
      } catch (e) {
        // Not a bcrypt hash
      }
    }
    
    if (!isPlaintextMatch && !isBcryptMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, clinic: user.clinic }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
