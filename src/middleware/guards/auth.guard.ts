import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Role } from 'src/constants/enum/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user from request
    const { user } = context.switchToHttp().getRequest();

    // Check if user has required role
    // For admin role
    if (requiredRoles.includes(Role.ADMIN)) {
      return user.isAdmin === true;
    }

    // For user role
    if (requiredRoles.includes(Role.USER)) {
      return true; // All authenticated users have USER role
    }

    return false;
  }
}
