import { Controller } from '@nestjs/common';
import { RegistrationService } from '../services/registration.service';

@Controller('Registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}
}
