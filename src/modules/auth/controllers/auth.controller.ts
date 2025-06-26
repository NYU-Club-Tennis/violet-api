import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { env } from 'src/constants/environment.constant';
import { UserService } from 'src/modules/user/services/user.service';
import { AppLogger } from 'src/modules/logger/logger.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserSignupRequestDTO } from '../dtos/auth.dto';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly salt: number = env.salt;
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @ApiOperation({ summary: 'User signup' })
  @Post('user/signup')
  async userSignup(@Body() body: UserSignupRequestDTO) {
    try {
      const { email } = body;
      const user = await this.userService.findByEmail(email);
      if (user) {
        throw new BadRequestException('User already Exists. ');
      }
      const userCreated = await this.userService.create({
        firstName: '',
        lastName: '',
        email,
        isAdmin: false,
        password: '',
        phoneNumber: '',
      });
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('User signup failed');
    }
  }
}
