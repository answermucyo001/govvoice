import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(serverRoot, '.env') });

const raw = process.env;

let databaseUrl = null;
if (raw.DATABASE_URL) {
  try {
    databaseUrl = new URL(raw.DATABASE_URL);
  } catch {
    databaseUrl = null;
  }
}

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dbHost = databaseUrl?.hostname || raw.DB_HOST || '127.0.0.1';
const dbPort = databaseUrl?.port ? Number.parseInt(databaseUrl.port, 10) : int(raw.DB_PORT, 3306);
const dbUser = databaseUrl?.username ? decodeURIComponent(databaseUrl.username) : raw.DB_USER || 'cfcs';
const dbPassword = databaseUrl?.password ? decodeURIComponent(databaseUrl.password) : raw.DB_PASSWORD || 'cfcs_dev_password';
const dbName = databaseUrl?.pathname
  ? (databaseUrl.pathname.startsWith('/') ? databaseUrl.pathname.slice(1) : databaseUrl.pathname)
  : raw.DB_NAME || 'cfcs';
const dbSsl = databaseUrl
  ? (databaseUrl.searchParams.get('ssl') === 'true' || bool(raw.DATABASE_SSL, true))
  : bool(raw.DATABASE_SSL, false);

const nodeEnv = raw.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const env = {
  nodeEnv,
  isProduction,
  port: int(raw.PORT, 5000),
  appUrl: raw.APP_URL || 'http://localhost:5173',
  apiUrl: raw.API_URL || `http://localhost:${int(raw.PORT, 5000)}`,

  db: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    name: dbName,
    ssl: dbSsl
  },

  jwt: {
    accessSecret: raw.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: raw.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessTtl: raw.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTtl: raw.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshTtlDays: int(raw.JWT_REFRESH_TTL_DAYS, 7)
  },

  bcryptCost: int(raw.BCRYPT_COST, 12),

  cookie: {
    sameSite: raw.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
    secure: bool(raw.COOKIE_SECURE, isProduction),
    domain: raw.COOKIE_DOMAIN || undefined,
    name: raw.COOKIE_NAME || 'cfcs_refresh'
  },

  encryptionKey: raw.ENCRYPTION_KEY || '',

  storage: {
    provider: raw.STORAGE_PROVIDER || (isProduction ? 'cloudinary' : 'local'),
    localDir: raw.LOCAL_UPLOAD_DIR || 'uploads',
    maxFiles: int(raw.MAX_UPLOAD_FILES, 5),
    maxSizeBytes: int(raw.MAX_UPLOAD_SIZE_BYTES, 5 * 1024 * 1024),
    cloudinary: {
      cloudName: raw.CLOUDINARY_CLOUD_NAME,
      apiKey: raw.CLOUDINARY_API_KEY,
      apiSecret: raw.CLOUDINARY_API_SECRET,
      folder: raw.CLOUDINARY_FOLDER || 'cfcs'
    },
    s3: {
      region: raw.AWS_REGION || 'eu-west-1',
      accessKeyId: raw.AWS_ACCESS_KEY_ID,
      secretAccessKey: raw.AWS_SECRET_ACCESS_KEY,
      bucket: raw.AWS_S3_BUCKET
    }
  },

  sms: {
    provider: raw.SMS_PROVIDER || 'console',
    senderId: raw.SMS_SENDER_ID || 'CFCS',
    africasTalking: {
      username: raw.AFRICASTALKING_USERNAME || 'sandbox',
      apiKey: raw.AFRICASTALKING_API_KEY
    },
    twilio: {
      accountSid: raw.TWILIO_ACCOUNT_SID,
      authToken: raw.TWILIO_AUTH_TOKEN,
      fromNumber: raw.TWILIO_FROM_NUMBER
    }
  },

  corsOrigins: raw.CORS_ORIGINS
    ? raw.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],

  rateLimit: {
    windowMs: int(raw.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(raw.RATE_LIMIT_MAX, 300),
    authMax: int(raw.AUTH_RATE_LIMIT_MAX, 30),
    submitMax: int(raw.SUBMIT_RATE_LIMIT_MAX, 20)
  },

  jobs: {
    enabled: bool(raw.ENABLE_ESCALATION_JOB, true),
    escalationCron: raw.ESCALATION_CRON || '*/15 * * * *'
  },

  superAdmin: {
    email: raw.SUPER_ADMIN_EMAIL || 'admin@govvoice.rw',
    phone: raw.SUPER_ADMIN_PHONE || '+250788000000',
    password: raw.SUPER_ADMIN_PASSWORD || 'ChangeMe123!',
    nationalId: raw.SUPER_ADMIN_NATIONAL_ID || '1198000000000001',
    firstName: raw.SUPER_ADMIN_FIRST_NAME || 'System',
    lastName: raw.SUPER_ADMIN_LAST_NAME || 'Administrator'
  },

  serveClient: bool(raw.SERVE_CLIENT, false),
  clientDistPath: path.resolve(serverRoot, raw.CLIENT_DIST_PATH || '../client/dist'),

  assertProductionConfig() {
    if (!isProduction) return;
    if (this.jwt.accessSecret.startsWith('dev-') || this.jwt.refreshSecret.startsWith('dev-')) {
      throw new Error('Production JWT secrets must be set.');
    }
    if (!this.encryptionKey || this.encryptionKey.length < 16) {
      throw new Error('Production ENCRYPTION_KEY must be set.');
    }
    if (this.storage.provider === 'local') {
      throw new Error('STORAGE_PROVIDER=local is not allowed in production.');
    }
    if (this.cookie.sameSite === 'none' && !this.cookie.secure) {
      throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.');
    }
  }
};

export default env;
export { env };