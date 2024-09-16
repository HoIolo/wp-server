import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { DTO_MESSAGE } from '../constant';

export class RegisterDTO {
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: DTO_MESSAGE.REGISTER.ACCOUNT,
  })
  @IsNotEmpty()
  @ApiProperty()
  account: string;

  @Matches(/^[^\s]+$/, {
    message: DTO_MESSAGE.REGISTER.PWD,
  })
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsEmail(
    {},
    {
      message: DTO_MESSAGE.REGISTER.EMAIL,
    },
  )
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @ApiProperty()
  email_code: string;
}
