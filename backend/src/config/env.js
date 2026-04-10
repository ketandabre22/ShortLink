/**
 * Validates required environment variables at startup.
 */
export function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'BASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters for production.');
  }
}
