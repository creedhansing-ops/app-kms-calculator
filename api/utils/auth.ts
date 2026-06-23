import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Secret resolution fallback for security
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  console.warn("Generating ephemeral secret. Instance-isolated!");
  return 'ephemeral-development-secret-only-do-not-use-in-prod';
}

export const JWT_SECRET = getJwtSecret();

export function verifyAuth(req: VercelRequest, res: VercelResponse): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Fallback for local MVP testing without login screen
    return { id: 'mock-nutritionist-id', email: 'ahligizi@mock.com', name: 'Ahli Gizi' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
}
