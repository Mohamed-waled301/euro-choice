import { createApp } from './app';
import { connectDB } from './config/db';
import { config } from './config/env';
import { logger } from './config/logger';
import { startExpirationCron } from './jobs/expirationJob';
import { seedDatabase } from './seed/seedData';

async function bootstrap() {
  try {
    await connectDB();

    // Auto-seed system defaults if needed
    try {
      await seedDatabase();
    } catch (seedErr) {
      logger.warn({ seedErr }, 'Database seeding notice');
    }

    // Start background expiration sweep
    startExpirationCron();

    const app = createApp();
    app.listen(config.port, () => {
      logger.info(`Euro Choice API server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error({ error }, 'Fatal error during API startup');
    process.exit(1);
  }
}

bootstrap();
