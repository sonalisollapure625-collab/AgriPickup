import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS setup
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests from this IP, please try again later.' },
  },
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files statically
app.use('/uploads', express.static(config.uploadDir));

// Health Check Endpoint (Required: GET /api/health)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'AgriPickup API',
    tagline: 'Find Nearby. Reserve Easily. Grow Better.',
    timestamp: new Date().toISOString(),
    env: config.env,
    databaseConfigured: !!config.databaseUrl,
  });
});

// Mount Central Modular Routes
app.use('/api', routes);

// 404 & Global Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
