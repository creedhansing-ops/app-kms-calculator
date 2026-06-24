import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_utils/db';
import { verifyAuth } from '../_utils/auth';

function evaluateWFA(zScore: number) {
  if (zScore < -3) return 'Gizi Buruk (Severely Underweight)';
  if (zScore < -2) return 'Gizi Kurang (Underweight)';
  if (zScore <= 1) return 'Gizi Baik (Normal)';
  return 'Risiko Berat Badan Lebih';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyAuth(req, res);
  if (!user) return;

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

      const csvRows = [];
      // Header
      csvRows.push([
        'Nomor RM',
        'Nama Pasien',
        'Tanggal Lahir',
        'Usia (Bulan)',
        'Jenis Kelamin',
        'Nama Orang Tua',
        'Alamat',
        'Tanggal Kunjungan Terakhir',
        'Berat Badan (kg)',
        'Tinggi Badan (cm)',
        'Status Gizi Terakhir (BB/U)'
      ].join(','));

      for (const p of patients) {
        const diffTime = Math.abs(new Date().getTime() - new Date(p.dateOfBirth).getTime());
        const age = Math.floor(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 30.44);
        const latestRecord = p.records.length > 0 ? p.records[0] : null;
        
        let statusGizi = 'Belum Ada Data';
        if (latestRecord && latestRecord.zScoreWFA !== null) {
          statusGizi = evaluateWFA(latestRecord.zScoreWFA);
        }

        const row = [
          `"${p.rmNumber || ''}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${new Date(p.dateOfBirth).toISOString().split('T')[0]}"`,
          age,
          p.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          `"${p.parentName.replace(/"/g, '""')}"`,
          `"${p.address.replace(/"/g, '""')}"`,
          latestRecord ? `"${new Date(latestRecord.date).toISOString().split('T')[0]}"` : '-',
          latestRecord ? latestRecord.weight : '-',
          latestRecord ? latestRecord.height : '-',
          `"${statusGizi}"`
        ];
        csvRows.push(row.join(','));
      }

      const csvString = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="laporan_kms_digital.csv"');
      return res.status(200).send(csvString);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
