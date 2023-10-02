import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { userProfileRules, usersex } from '../constant';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileDTO {
  @IsOptional()
  @IsString()
  @MinLength(userProfileRules.username.MIN_LENGTH)
  @MaxLength(userProfileRules.username.MAX_LENGTH)
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(userProfileRules.usersign.MAX_LENGTH)
  @ApiProperty()
  signature: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  avatar: string;

  @IsOptional()
  @ApiProperty()
  sex: usersex;
}
