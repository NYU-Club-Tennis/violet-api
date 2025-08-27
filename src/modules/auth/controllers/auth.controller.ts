import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Inject,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { env } from 'src/constants/environment.constant';
import { UserService } from 'src/modules/user/services/user.service';
import { AppLogger } from 'src/modules/logger/logger.service';
import { MailService } from 'src/modules/mail/services/mail.service';
import { REDIS_CLIENT } from 'src/constants/redis.constant';
import Redis from 'ioredis';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthResponseDTO,
  AuthTokenCheckDTO,
  ForgotPasswordDTO,
  IAuthCreateProfileRequestDTO,
  LoginDto,
  ResetPasswordDTO,
  RotateRefreshTokenDTO,
  SuccessResultDTO,
  TokenRefreshResponseDTO,
  UserSignupRequestDTO,
  ChangePasswordDTO,
} from '../dtos/auth.dto';
import { IAuthLoginRequest } from '../interfaces/auth.interface';
import { MembershipLevel } from 'src/constants/enum/membership.enum';
import { AuthGuard } from 'src/middleware/guards/auth.guard';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    private readonly logger: AppLogger,
    private readonly mailService: MailService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @ApiOperation({ summary: 'User signup or resend verification' })
  @ApiResponse({
    status: 201,
    description: 'Verification email sent',
    type: AuthResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid email or rate limit exceeded',
  })
  @Post('signup')
  async userSignup(@Body() body: UserSignupRequestDTO) {
    try {
      const { email } = body;

      // Validate email domain
      if (!email.endsWith('@nyu.edu')) {
        throw new BadRequestException('Only NYU email addresses are allowed');
      }

      // Check if user already exists in database
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      // Generate and store new token
      const token = await this.authService.createEmailVerificationToken(email);

      // Send verification email
      await this.mailService.sendVerificationEmail(email, token);

      return {
        message: 'Please check your email to complete registration',
      };
    } catch (error) {
      this.logger.error('User signup failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Signup process failed');
    }
  }

  @Get('/validate-code')
  @HttpCode(HttpStatus.OK)
  async checkToken(@Query() query: AuthTokenCheckDTO) {
    try {
      const { token } = query;

      const email = await this.authService.checkUserAuthToken(token);

      if (!email) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      return { email };
    } catch (error) {
      this.logger.error('Error checking token', error);
      throw error;
    }
  }

  @Post('create-profile')
  async createProfile(@Body() body: IAuthCreateProfileRequestDTO) {
    try {
      const { firstName, lastName, phoneNumber, password, email } = body;

      // Verify that this email has a valid token
      const token = await this.authService.getTokenByEmail(email);
      if (!token) {
        throw new BadRequestException(
          'No valid verification token found for this email',
        );
      }

      await this.userService.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        isAdmin: false,
        isBanned: false,
        noShowCount: 0,
        membershipLevel: MembershipLevel.USER,
      });

      const authUser = await this.authService.userLogin({
        email,
        password,
      });

      // After successful profile creation, clean up the tokens
      await this.authService.cleanupVerificationTokens(email);

      return authUser;
    } catch (error) {
      this.logger.error('Error creating profile', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to create profile',
      );
    }
  }

  @ApiOperation({ summary: 'Refresh Token.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refresh Token Successfully.',
    type: TokenRefreshResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: RotateRefreshTokenDTO,
  ): Promise<TokenRefreshResponseDTO> {
    try {
      const payload = await this.authService.verifyRefreshToken(
        body.refreshToken,
      );

      const result = await this.authService.refreshToken(body.refreshToken);
      return result;
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials or account locked',
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const authResult = await this.authService.userLogin(loginDto);
      if (!authResult) {
        throw new BadRequestException('Invalid credentials');
      }
      return authResult;
    } catch (error) {
      this.logger.error('Login failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() body: ForgotPasswordDTO,
  ): Promise<SuccessResultDTO> {
    try {
      const { email } = body;

      const token = await this.authService.createEmailVerificationToken(email);

      await this.mailService.sendForgotPasswordEmail(email, token);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Forgot password failed', error);
      throw new BadRequestException('Forgot password failed');
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    type: SuccessResultDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token, expired token, or user not found',
  })
  async resetPassword(
    @Body() body: ResetPasswordDTO,
  ): Promise<SuccessResultDTO> {
    try {
      const { email, password, token } = body;

      // Validate email domain
      if (!email.endsWith('@nyu.edu')) {
        throw new BadRequestException('Only NYU email addresses are allowed');
      }

      // Verify the reset token
      const storedEmail = await this.redis.get(`reset_password:${token}`);

      if (!storedEmail || storedEmail !== email) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check if user exists
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Update the user's password
      await this.userService.update(user.id, { password });

      // Clear the used token from Redis
      await this.authService.cleanupVerificationTokens(email);

      this.logger.log(`Password reset successful for user: ${email}`);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Reset password failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Reset password failed');
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
    type: SuccessResultDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid current password or new password',
  })
  async changePassword(
    @Body() body: ChangePasswordDTO,
    @Request() req: any,
  ): Promise<SuccessResultDTO> {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = body;

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const isPasswordValid = await this.authService.comparePasswords(
        currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Invalid current password');
      }

      await this.userService.update(userId, { password: newPassword });

      this.logger.log(`Password changed successfully for user: ${user.email}`);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Change password failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Change password failed');
    }
  }
}
