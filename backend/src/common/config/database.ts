import mongoose from 'mongoose';
import { MONGODB_URI } from './environment';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Successfully connected to MongoDB database');
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);
  }
};
