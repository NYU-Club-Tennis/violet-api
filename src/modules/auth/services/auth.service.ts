import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/modules/user/services/user.service';
import { generateSecureToken } from 'src/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/entities/user.entity';
import { env } from 'src/constants/environment.constant';
import { REDIS_CLIENT } from 'src/constants/redis.constant';
import Redis from 'ioredis';
import {
  IAuthUser,
  ISignTokenPayload,
  IAuthLoginRequest,
} from '../interfaces/auth.interface';
import { IUser } from 'src/modules/user/interfaces/user.interface';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly BAN_DURATION = 24 * 60 * 60; // 24 hours in seconds
  private readonly EMAIL_COOLDOWN = 2 * 60; // 2 minutes in seconds
  private readonly LOGIN_ATTEMPT_EXPIRY = 60 * 60; // 1 hour in seconds
  private readonly JWT_EXPIRATION = '24h';
  private readonly JWT_REFRESH_EXPIRATION = '7d';
  private readonly VERIFICATION_PREFIX = 'email_verification:';
  private readonly VERIFICATION_EXPIRY = 24 * 60 * 60; // 24 hours
  private readonly TIME_SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private getLoginAttemptsKey(email: string): string {
    return `login_attempts:${email}`;
  }

  private getBanKey(email: string): string {
    return `banned:${email}`;
  }

  private getEmailLastSentKey(email: string): string {
    return `email_verification_last_sent:${email}`;
  }

  async checkEmailRateLimit(
    email: string,
  ): Promise<{ canSend: boolean; waitTime?: number }> {
    const lastSentKey = this.getEmailLastSentKey(email);
    const lastSentTimestamp = await this.redis.get(lastSentKey);

    if (!lastSentTimestamp) {
      return { canSend: true };
    }

    const lastSentTime = new Date(lastSentTimestamp).getTime();
    const now = new Date().getTime();
    const timeSinceLastSent = Math.floor((now - lastSentTime) / 1000); // in seconds

    if (timeSinceLastSent < this.EMAIL_COOLDOWN) {
      const waitTime = this.EMAIL_COOLDOWN - timeSinceLastSent;
      return { canSend: false, waitTime };
    }

    return { canSend: true };
  }

  async updateLastEmailSent(email: string): Promise<void> {
    const lastSentKey = this.getEmailLastSentKey(email);
    const timestamp = new Date().toISOString();

    await this.redis.set(lastSentKey, timestamp, 'EX', 60 * 60); // 1 hour expiry
  }

  private async throwBanException(email: string): Promise<never> {
    const banKey = this.getBanKey(email);
    const banExpiration = await this.redis.get(banKey);

    if (!banExpiration) {
      throw new BadRequestException('Account is banned');
    }

    const banExpirationTime = new Date(banExpiration).getTime();
    const now = new Date().getTime();
    const hoursRemaining = Math.ceil(
      (banExpirationTime - now) / (1000 * 60 * 60),
    );

    throw new BadRequestException(
      `This email has been temporarily banned due to too many failed attempts. Please try again in ${hoursRemaining} hours.`,
    );
  }

  async isEmailBanned(email: string): Promise<boolean> {
    const banKey = this.getBanKey(email);
    const banExpiration = await this.redis.get(banKey);

    if (!banExpiration) {
      return false;
    }

    const isStillBanned =
      new Date().getTime() < new Date(banExpiration).getTime();
    if (!isStillBanned) {
      await this.redis.del(banKey);
      return false;
    }

    return true;
  }

  async incrementLoginAttempts(email: string): Promise<number> {
    const key = this.getLoginAttemptsKey(email);

    const newAttempts = await this.redis.incr(key);

    if (newAttempts === 1) {
      await this.redis.expire(key, this.BAN_DURATION);
    }

    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const banExpiration = new Date(Date.now() + this.BAN_DURATION * 1000);
      const banExpirationIso = banExpiration.toISOString();

      await this.redis.set(
        this.getBanKey(email),
        banExpirationIso,
        'EX',
        this.BAN_DURATION,
      );

      await this.throwBanException(email);
    }

    return newAttempts;
  }

  async resetLoginAttempts(email: string): Promise<void> {
    const attemptsKey = this.getLoginAttemptsKey(email);
    await this.redis.del(attemptsKey);
  }

  async userLogin(params: IAuthLoginRequest) {
    const { email, password } = params;

    // Check if email is banned
    const isBanned = await this.isEmailBanned(email);
    if (isBanned) {
      await this.throwBanException(email);
    }

    const user = await this.userService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      // Reset login attempts on successful login
      await this.resetLoginAttempts(email);

      const authUser: IAuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        noShowCount: user.noShowCount,
        isAdmin: user.isAdmin,
      };

      const payload: ISignTokenPayload = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      };

      const token = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.JWT_REFRESH_EXPIRATION,
        secret: env.jwt.refreshTokenSecret,
      });

      await this.redis.set(
        this.getRefreshTokenKey(user.id),
        refreshToken,
        'EX',
        7 * 24 * 60 * 60, // 7 days in seconds
      );

      await this.userService.updateLastSignInAt(user.id);

      return {
        user: authUser,
        token,
        refreshToken,
      };
    }

    // Increment failed attempts and get remaining attempts
    const attempts = await this.incrementLoginAttempts(email);
    const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - attempts;

    throw new BadRequestException(
      `Invalid credentials. ${remainingAttempts} attempts remaining before temporary ban.`,
    );
  }

  async checkUserAuthToken(token: string): Promise<string | null> {
    const userEmail = await this.redis.get(this.getResetPasswordKey(token));
    return userEmail;
  }

  private getResetPasswordKey(token: string): string {
    return `reset_password:${token}`;
  }

  private getRefreshTokenKey(id: number): string {
    return `refresh_token:${id}`;
  }

  private getUserToTokenKey(email: string): string {
    return `reset_password_users:${email}`;
  }

  async getTokenByEmail(email: string): Promise<string | null> {
    const token = await this.redis.get(this.getUserToTokenKey(email));
    return token;
  }

  async cleanupVerificationTokens(email: string): Promise<void> {
    const token = await this.getTokenByEmail(email);
    if (token) {
      await this.redis.del(this.getUserToTokenKey(email));
      await this.redis.del(this.getResetPasswordKey(token));
    }
  }

  private async removeExistingResetToken(email: string): Promise<void> {
    const oldToken = await this.redis.get(this.getUserToTokenKey(email));
    if (oldToken) {
      await this.redis.del(this.getResetPasswordKey(oldToken));
    }
  }

  async createEmailVerificationToken(email: string): Promise<string> {
    // Check email rate limiting instead of ban
    const { canSend, waitTime } = await this.checkEmailRateLimit(email);
    if (!canSend && waitTime) {
      const minutes = Math.ceil(waitTime / 60);
      const seconds = waitTime % 60;
      const timeMessage =
        minutes > 0
          ? `${minutes} minute${minutes > 1 ? 's' : ''}`
          : `${seconds} seconds`;
      throw new BadRequestException(
        `Please wait ${timeMessage} before requesting another verification email.`,
      );
    }

    await this.removeExistingResetToken(email);
    const token = generateSecureToken();

    await Promise.all([
      this.redis.set(this.getResetPasswordKey(token), email, 'EX', 3600),
      this.redis.set(this.getUserToTokenKey(email), token, 'EX', 3600),
    ]);

    // Update last email sent timestamp
    await this.updateLastEmailSent(email);

    return token;
  }

  async verifyEmailToken(token: string): Promise<{ email: string }> {
    const verificationKey = `${this.VERIFICATION_PREFIX}${token}`;
    const storedEmail = await this.redis.get(verificationKey);

    if (!storedEmail) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    return { email: storedEmail };
  }

  async deleteVerificationToken(token: string): Promise<void> {
    const verificationKey = `${this.VERIFICATION_PREFIX}${token}`;
    await this.redis.del(verificationKey);
  }

  async deleteVerificationTokenByEmail(email: string): Promise<void> {
    // Get all keys in Redis that match our verification prefix
    const keys = await this.redis.keys(`${this.VERIFICATION_PREFIX}*`);

    // Check each key to find the one that maps to our email
    for (const key of keys) {
      const storedEmail = await this.redis.get(key);
      if (storedEmail === email) {
        // Found the matching token, delete it
        await this.redis.del(key);
        break;
      }
    }
  }

  async verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verify(refreshToken, {
      secret: env.jwt.refreshTokenSecret,
    });
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    const storedToken = await this.redis.get(
      this.getRefreshTokenKey(payload.id),
    );

    if (storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }
    const { exp: _exp, iat: _iat, ...restPayload } = payload;
    const newAccessToken = this.jwtService.sign(restPayload);
    const newRefreshToken = this.jwtService.sign(restPayload, {
      expiresIn: this.JWT_REFRESH_EXPIRATION,
      secret: env.jwt.refreshTokenSecret,
    });

    await this.redis.set(
      this.getRefreshTokenKey(payload.id),
      newRefreshToken,
      'EX',
      this.TIME_SEVEN_DAYS_IN_SECONDS,
    );

    return { token: newAccessToken, refreshToken: newRefreshToken };
  }
}
