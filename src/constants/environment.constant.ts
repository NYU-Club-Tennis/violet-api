import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
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
};
