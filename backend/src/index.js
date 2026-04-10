import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validateEnv } from './config/env.js';
import { connectDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { redirectByCode } from './controllers/urlController.js';

validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '32kb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);

/** Public short link redirect (must be after /api routes). */
app.get('/:code', redirectByCode);

app.use(errorHandler);

async function main() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
