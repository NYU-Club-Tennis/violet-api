import { ApiProperty } from '@nestjs/swagger';

export class UserSignupRequestDTO {
  @ApiProperty({
    description: 'User email',
    example: 'test@test.com',
    type: String,
  })
  email: string;
}
