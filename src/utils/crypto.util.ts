import { randomBytes } from 'crypto';

export const generateSecureToken = (length = 64): string => {
  return randomBytes(length).toString('hex').slice(0, length);
};
