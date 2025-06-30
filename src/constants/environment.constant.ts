import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  url: {
    frontend: process.env.FRONTEND_URL,
  },
  database: {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dbname: process.env.DB_NAME,
    port: +(process.env.DB_PORT || 5432),
    sync: !!(process.env.DB_SYNC === 'true'),
    log: !!(process.env.DB_LOG === 'true'),
  },
  salt: +(process.env.SALT || 10),
  mail: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET_KEY,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET_KEY,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: +(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    db: +(process.env.REDIS_DB || 0),
    tls: process.env.REDIS_TLS === 'true',
  },
};
