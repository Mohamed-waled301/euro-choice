import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

export async function connectDB(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || config.mongoUri;
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB Connection Error');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
