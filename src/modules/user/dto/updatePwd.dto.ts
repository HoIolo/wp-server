import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { DTO_MESSAGE } from '../constant';

export class UpdatePwdDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  oldPassword: string;

  @Matches(/^[^\s]+$/, {
    message: DTO_MESSAGE.REGISTER.PWD,
  })
  @IsNotEmpty()
  @ApiProperty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  checkCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  username: string;
}
