import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Impor semua Vercel API Handlers
import loginHandler from './api/auth/login.ts';
import settingsPasswordHandler from './api/settings/password.ts';
import settingsIndexHandler from './api/settings/index.ts';
import exportIndexHandler from './api/export/index.ts';
import dashboardHandler from './api/dashboard/index.ts';
import patientsHandler from './api/patients/index.ts';
import patientIdHandler from './api/patients/[id].ts';
import recordsHandler from './api/records/index.ts';
import recordIdHandler from './api/records/[id].ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Helper wrapper untuk meneruskan req, res layaknya Vercel serverless
const createVercelHandler = (handler: any) => {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

// Pasang routes API Backend
app.all('/api/auth/login', createVercelHandler(loginHandler));
app.all('/api/settings/password', createVercelHandler(settingsPasswordHandler));
app.all('/api/settings', createVercelHandler(settingsIndexHandler));
app.all('/api/export', createVercelHandler(exportIndexHandler));
app.all('/api/dashboard', createVercelHandler(dashboardHandler));

app.all('/api/patients', createVercelHandler(patientsHandler));
app.all('/api/patients/:id', (req, res) => {
  req.query.id = req.params.id; // Passing ID parameter
  return createVercelHandler(patientIdHandler)(req, res);
});

app.all('/api/records', createVercelHandler(recordsHandler));
app.all('/api/records/:id', (req, res) => {
  req.query.id = req.params.id;
  return createVercelHandler(recordIdHandler)(req, res);
});

// Sajikan file statis React (hasil dari npm run build -> folder dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback: Semua request yang tidak cocok dengan API akan dikembalikan ke index.html React (SPA Routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KMS Digital Server berjalan di http://localhost:${PORT}`);
});
