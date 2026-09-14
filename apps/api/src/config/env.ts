import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to local .env if present

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/euro_choice',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'eurochoice_access_secret_key_prod_default_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'eurochoice_refresh_secret_key_prod_default_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  expirationCronSchedule: process.env.EXPIRATION_CRON_SCHEDULE || '*/15 * * * *',
};
