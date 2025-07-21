/**
 * Environment Configuration
 * Manages environment variables and configuration
 */

import { config } from 'dotenv';

// Load environment variables
config();

export const envConfig = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000'),
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || './data/flowtune.db',
  
  // FlowGram Runtime configuration
  FLOWGRAM_API_KEY: process.env.FLOWGRAM_API_KEY,
  FLOWGRAM_SECRET: process.env.FLOWGRAM_SECRET,
  
  // CORS configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
