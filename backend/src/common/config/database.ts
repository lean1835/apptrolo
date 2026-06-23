import mongoose from 'mongoose';
import { MONGODB_URI } from './environment';
import { logger } from '../utils/logger';
import dns from 'dns';

// Force public DNS resolution to bypass local SRV lookup refuse errors (ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  logger.warn('Failed to set custom DNS servers', err);
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Successfully connected to MongoDB database');
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);
  }
};
