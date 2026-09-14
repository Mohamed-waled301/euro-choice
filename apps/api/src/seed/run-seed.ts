import { connectDB, disconnectDB } from '../config/db';
import { seedDatabase } from './seedData';
import { logger } from '../config/logger';

async function main() {
  try {
    await connectDB();
    await seedDatabase();
    logger.info('Seed script finished successfully.');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    await disconnectDB();
    process.exit(1);
  }
}

main();
