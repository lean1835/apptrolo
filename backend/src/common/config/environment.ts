import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const PORT: number = parseInt(process.env.PORT || '8080', 10);
export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/apptrololo';
export const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback_secret_key';
export const JWT_EXPIRATION: string = process.env.JWT_EXPIRATION || '86400000';
